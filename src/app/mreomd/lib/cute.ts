/** Playful messages shown with the sticker after each practice answer. */

export const PET_NAMES = [
  "любовь моя",
  "любимая моя",
  "любимка моя",
  "милая моя",
  "кися моя",
  "зайка моя",
  "кисюничка моя",
  "дорогая моя",
  "душа моя",
  "родная моя",
  "солнышко моё",
  "душенька моя",
  "моя любимая Виктория",
  "Викуня",
  "Викуся",
  "котеночек моя",
  "моя любимая Вика",
  "красоточка моя",
  "богиня моя",
  "самая лучшая моя любимость",
];

const PRAISE = ["Молодчинка", "Умничка", "Так держать", "Умничка моя", "Ты лучшая"];

const SUPPORT = [
  "Ничего страшного",
  "Не грусти",
  "Почти получилось",
  "В следующий раз точно",
  "Ошибаться можно",
];

/** Said with the support line after a wrong answer. */
const BELIEVE = ["я в тибя верююю", "я в тебя верю", "я в тебя верю, любовь моя", "у тебя всё получится"];

/** Fun phrases for correct answers, shown as is. */
export const FUN_PHRASES = [
  "Моггаешь всех",
  "Викоооо 🥺",
  "Я тебя люблюююююююююююю",
  "Нихуя себе себе",
  "У меня фиолетовые волосы",
  "Ура ура урааааааа",
  "Владимир Владимирович",
  "«Один из них держал нож у моего горла, пока второй выносил всё из квартиры.» — Игорь Синяк",
  "Я АРУУУУУУУ",
  "ИТАДАКИМОС",
  "БЕРЛИН БЕРЛИН ИСТ МЕГАКУЛ",
  "Жопа))",
  ":*****",
  "Сися",
  "СИКС СЕВЕН",
  "ЧИЧАС ВЗОРВУСЬ",
  "ОБОНЯТЕЛЬНАЯ МОЯ",
  "Выглядишь так, будто не работала ни дня в жизни (АХУИТИТЕЛЬНО)",
  "Обедик Уютненько",
  "Ни дня в жизни не работала",
  "ДАЙ МНЕ НОЖ Я ЭТО СДЕЛАЮ",
  "Чичен бубир",
  "Приятных душевных действий",
  "ЗАЙКА ТЫ СПРАВИШЬСЯ",
  "Давай давай давай давай *асмр*",
  "Я аж немного простонал",
];

type Rng = () => number;

function pick<T>(list: T[], rnd: Rng): T {
  return list[Math.floor(rnd() * list.length)];
}

const VOWELS = "аеёиоуыэюяАЕЁИОУЫЭЮЯ";

/** Stretches the last vowel of a word: "верю" -> "верююю". */
export function stretch(word: string, times = 3): string {
  for (let i = word.length - 1; i >= 0; i--) {
    if (VOWELS.includes(word[i])) return word.slice(0, i + 1) + word[i].repeat(times - 1) + word.slice(i + 1);
  }
  return word;
}

/** Baby talk: "ты" -> "тиии", other "ы" -> "и", "тебя" -> "тибя". */
export function babyTalk(text: string): string {
  return text
    .replace(/(^|[^а-яё])(т)ы(?=[^а-яё]|$)/gi, (_, pre: string, t: string) => `${pre}${t}иии`)
    .replace(/тебя/g, "тибя")
    .replace(/Тебя/g, "Тибя")
    .replace(/ы/g, "и")
    .replace(/Ы/g, "И");
}

/** Repeats the last word: "нихуя себе" -> "нихуя себе себе". */
export function doubleLastWord(text: string): string {
  const m = text.match(/^(.*?)([А-Яа-яЁёA-Za-z]+)([^А-Яа-яЁёA-Za-z]*)$/);
  return m ? `${m[1]}${m[2]} ${m[2]}${m[3]}` : text;
}

/** Applies the silly transforms at random so messages don't all look the same. */
export function funnify(text: string, rnd: Rng = Math.random): string {
  let out = text;
  if (rnd() < 0.5) out = babyTalk(out);
  if (rnd() < 0.5) {
    const words = out.split(" ");
    const i = words.length - 1 - Math.floor(rnd() * Math.min(2, words.length));
    words[i] = stretch(words[i], 3 + Math.floor(rnd() * 3));
    out = words.join(" ");
  }
  if (rnd() < 0.2) out = doubleLastWord(out);
  return out;
}

export function correctMessage(rnd: Rng = Math.random): string {
  if (rnd() < 0.4) return pick(FUN_PHRASES, rnd);
  return funnify(`${pick(PRAISE, rnd)}, ${pick(PET_NAMES, rnd)}!`, rnd);
}

export function wrongMessage(rnd: Rng = Math.random): string {
  return funnify(`${pick(SUPPORT, rnd)}, ${pick(PET_NAMES, rnd)}, ${pick(BELIEVE, rnd)}`, rnd);
}
