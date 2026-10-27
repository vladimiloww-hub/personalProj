/**
 * Word lists for the word games. The lists are big, so each language is
 * fetched on demand and cached; call loadDict() early (e.g. on mount) to
 * have it ready by the time the first guess is submitted.
 */

export type Lang = "ru" | "en";

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const LANGS: { id: Lang; label: string }[] = [
  { id: "ru", label: "Русские" },
  { id: "en", label: "English" },
];

const ALPHABET: Record<Lang, RegExp> = {
  ru: /^[а-я]+$/,
  en: /^[a-z]+$/,
};

export function isLang(value: unknown): value is Lang {
  return value === "ru" || value === "en";
}

/** Lower-cases and folds ё into е, the way the lists store words. */
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/ё/g, "е");
}

/** True for a normalized letter of the language's alphabet. */
export function isLetter(letter: string, lang: Lang): boolean {
  return letter.length === 1 && ALPHABET[lang].test(letter);
}

/** True when the word has the game's length and only letters of the language. */
export function isWordShape(word: string, lang: Lang): boolean {
  return word.length === WORD_LENGTH && ALPHABET[lang].test(word);
}

export interface Dict {
  lang: Lang;
  answers: string[];
  allowed: Set<string>;
}

const cache = new Map<Lang, Promise<Dict>>();

export function loadDict(lang: Lang): Promise<Dict> {
  let pending = cache.get(lang);
  if (!pending) {
    const source = lang === "ru" ? import("../data/ru") : import("../data/en");
    pending = source.then(({ ANSWERS, EXTRA }) => {
      const answers = ANSWERS.split(" ");
      return { lang, answers, allowed: new Set([...answers, ...EXTRA.split(" ")]) };
    });
    // A failed chunk load (flaky network) should be retried on the next call.
    pending.catch(() => cache.delete(lang));
    cache.set(lang, pending);
  }
  return pending;
}

/** A random hidden word, avoiding the given ones while there are others left. */
export function randomAnswer(dict: Dict, avoid: Iterable<string> = []): string {
  const skip = new Set(avoid);
  const pool = dict.answers.filter((w) => !skip.has(w));
  const from = pool.length > 0 ? pool : dict.answers;
  return from[Math.floor(Math.random() * from.length)];
}
