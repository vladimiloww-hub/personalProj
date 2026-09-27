import { QUESTIONS } from "../data/questions";
import { CATEGORY_BY_CODE } from "../data/meta";
import type { CategoryCode, Question, TopicId } from "./types";

export { QUESTIONS };

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

/** Sequential number of each question in the bank (1-based), used as "№". */
export const QUESTION_NO: Record<string, number> = Object.fromEntries(
  QUESTIONS.map((q, i) => [q.id, i + 1]),
);

export function appliesToCategory(q: Question, cat: CategoryCode | "all"): boolean {
  if (cat === "all" || !q.veh) return true;
  const groups = CATEGORY_BY_CODE[cat]?.groups ?? [];
  return q.veh.some((g) => groups.includes(g));
}

export function questionsFor(cat: CategoryCode | "all", topic?: TopicId): Question[] {
  return QUESTIONS.filter(
    (q) => appliesToCategory(q, cat) && (!topic || q.topic === topic),
  );
}

export function shuffle<T>(items: readonly T[], rnd: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` questions for an exam ticket, spreading them across topics
 * the way the official tickets mix subjects: shuffle topics, then take one
 * question per topic in rounds until the ticket is full.
 */
export function pickExamQuestions(
  pool: readonly Question[],
  count: number,
  rnd: () => number = Math.random,
): Question[] {
  const byTopic = new Map<TopicId, Question[]>();
  for (const q of shuffle(pool, rnd)) {
    const list = byTopic.get(q.topic) ?? [];
    list.push(q);
    byTopic.set(q.topic, list);
  }
  const buckets = shuffle([...byTopic.values()], rnd);
  const picked: Question[] = [];
  while (picked.length < count && buckets.some((b) => b.length > 0)) {
    for (const b of buckets) {
      const q = b.pop();
      if (q) picked.push(q);
      if (picked.length === count) break;
    }
  }
  return shuffle(picked, rnd);
}

/** Answer order for a question: identity, or a stable shuffle per session seed. */
export function answerOrder(q: Question, shuffled: boolean, seed: number): number[] {
  const idx = q.a.map((_, i) => i);
  if (!shuffled) return idx;
  let h = seed;
  for (const ch of q.id) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  const rnd = () => {
    h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) | 0;
    return ((h >>> 0) % 100000) / 100000;
  };
  return shuffle(idx, rnd);
}
