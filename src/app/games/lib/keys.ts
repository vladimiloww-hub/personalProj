import { isLetter, normalizeWord, type Lang } from "./words";

export const ENTER = "enter";
export const BACK = "back";

/** On-screen keyboard rows; Enter and Backspace sit at the ends of the last row. */
export const LAYOUTS: Record<Lang, string[][]> = {
  ru: [
    Array.from("йцукенгшщзхъ"),
    Array.from("фывапролджэ"),
    [ENTER, ...Array.from("ячсмитьбю"), BACK],
  ],
  en: [
    Array.from("qwertyuiop"),
    Array.from("asdfghjkl"),
    [ENTER, ...Array.from("zxcvbnm"), BACK],
  ],
};

/** ЙЦУКЕН letters by physical key, so Russian works with a Latin layout on. */
const RU_BY_CODE: Record<string, string> = {
  KeyQ: "й", KeyW: "ц", KeyE: "у", KeyR: "к", KeyT: "е", KeyY: "н", KeyU: "г", KeyI: "ш",
  KeyO: "щ", KeyP: "з", BracketLeft: "х", BracketRight: "ъ", KeyA: "ф", KeyS: "ы", KeyD: "в",
  KeyF: "а", KeyG: "п", KeyH: "р", KeyJ: "о", KeyK: "л", KeyL: "д", Semicolon: "ж", Quote: "э",
  KeyZ: "я", KeyX: "ч", KeyC: "с", KeyV: "м", KeyB: "и", KeyN: "т", KeyM: "ь", Comma: "б",
  Period: "ю", Backquote: "е",
};

interface KeyLike {
  key: string;
  code: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** Maps a keydown to ENTER, BACK, a letter of the language, or null. */
export function keyFromEvent(e: KeyLike, lang: Lang): string | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === "Enter") return ENTER;
  if (e.key === "Backspace") return BACK;
  const typed = normalizeWord(e.key);
  if (isLetter(typed, lang)) return typed;
  if (lang === "ru") return RU_BY_CODE[e.code] ?? null;
  return /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : null;
}

/** Digit keys for bulls and cows (top row and numpad). */
export function digitFromEvent(e: KeyLike): string | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === "Enter") return ENTER;
  if (e.key === "Backspace") return BACK;
  if (/^\d$/.test(e.key)) return e.key;
  const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
  return m ? m[1] : null;
}
