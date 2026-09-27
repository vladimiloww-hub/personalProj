import { TOPIC_BY_ID } from "../data/meta";
import { QUESTION_BY_ID, questionsFor, shuffle } from "./bank";
import { hardest } from "./progress";
import { FAVORITES_ID, type State } from "./store";
import type { Question } from "./types";

export type PracticeMode =
  | "all"
  | "random"
  | "new"
  | "mistakes"
  | "hard"
  | "list"
  | "topic"
  | "ticket"
  | "custom";

export const RANDOM_SIZE = 20;
const CUSTOM_KEY = "mreomd:custom";

export interface PracticeSession {
  title: string;
  subtitle?: string;
  questions: Question[];
  empty?: string;
}

/** Hand a specific set of questions (search results, exam mistakes…) to /practice?mode=custom. */
export function stashCustomSession(title: string, ids: string[]) {
  try {
    window.sessionStorage.setItem(CUSTOM_KEY, JSON.stringify({ title, ids }));
  } catch {
    // Without sessionStorage the custom session will simply be empty.
  }
}

function readCustomSession(): { title: string; ids: string[] } | null {
  try {
    const raw = window.sessionStorage.getItem(CUSTOM_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v?.title === "string" && Array.isArray(v?.ids) ? v : null;
  } catch {
    return null;
  }
}

export function practiceHref(mode: PracticeMode, extra: Record<string, string | number> = {}) {
  const p = new URLSearchParams({ mode, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) });
  return `/mreomd/practice?${p.toString()}`;
}

const byIds = (ids: string[]) => ids.map((id) => QUESTION_BY_ID[id]).filter((q): q is Question => Boolean(q));

export function buildSession(
  mode: PracticeMode,
  params: { topic?: string | null; list?: string | null; ticket?: string | null },
  state: State,
): PracticeSession {
  const cat = state.settings.cat;
  const pool = questionsFor(cat);
  const stats = state.stats;

  switch (mode) {
    case "all":
      return { title: "Марафон", subtitle: `Все вопросы категории ${cat} по порядку`, questions: pool };
    case "random":
      return {
        title: "Случайные вопросы",
        subtitle: `${RANDOM_SIZE} случайных вопросов категории ${cat}`,
        questions: shuffle(pool).slice(0, RANDOM_SIZE),
      };
    case "new":
      return {
        title: "Новые вопросы",
        subtitle: "Вопросы, на которые вы ещё не отвечали",
        questions: pool.filter((q) => !stats[q.id]),
        empty: "Вы уже ответили на все вопросы этой категории. Отличная работа!",
      };
    case "mistakes":
      return {
        title: "Работа над ошибками",
        subtitle: "Вопросы, на которые последний ответ был неверным. Верный ответ убирает вопрос из списка.",
        questions: pool.filter((q) => stats[q.id]?.last === "w"),
        empty: "Ошибок нет. Ответы, данные неверно, будут появляться здесь.",
      };
    case "hard":
      return {
        title: "Сложные вопросы",
        subtitle: "Вопросы, в которых вы ошибались чаще всего",
        questions: hardest(pool, stats),
        empty: "Пока нет вопросов с ошибками.",
      };
    case "list": {
      const list = state.lists.find((l) => l.id === (params.list ?? FAVORITES_ID));
      return {
        title: list?.name ?? "Список",
        subtitle: "Вопросы из вашего списка",
        questions: list ? byIds(list.qids) : [],
        empty: list ? "В этом списке пока нет вопросов." : "Список не найден.",
      };
    }
    case "topic": {
      const topic = params.topic ? TOPIC_BY_ID[params.topic] : undefined;
      return {
        title: topic ? `${topic.icon} ${topic.name.ru}` : "Тема",
        subtitle: `Категория ${cat}`,
        questions: topic ? questionsFor(cat, topic.id) : [],
        empty: "В этой теме нет вопросов для выбранной категории.",
      };
    }
    case "ticket": {
      const n = Number(params.ticket);
      return {
        title: `Билет ${n}`,
        questions: pool.filter((q) => q.ticket === n),
        empty: "Билет не найден.",
      };
    }
    case "custom": {
      const custom = readCustomSession();
      return {
        title: custom?.title ?? "Подборка",
        questions: custom ? byIds(custom.ids) : [],
        empty: "Подборка пуста — запустите её заново из поиска или результатов экзамена.",
      };
    }
  }
}

export function isPracticeMode(v: string | null): v is PracticeMode {
  return (
    v === "all" ||
    v === "random" ||
    v === "new" ||
    v === "mistakes" ||
    v === "hard" ||
    v === "list" ||
    v === "topic" ||
    v === "ticket" ||
    v === "custom"
  );
}
