import type { State } from "./store";
import type { Question } from "./types";

export interface Progress {
  total: number;
  /** Questions answered at least once. */
  seen: number;
  /** Questions whose latest answer was correct. */
  known: number;
  /** Questions whose latest answer was wrong — the "mistakes" set. */
  mistakes: number;
  /** Share of correct attempts over all attempts, 0..1 (null when nothing answered). */
  accuracy: number | null;
}

export function progressFor(questions: readonly Question[], stats: State["stats"]): Progress {
  let seen = 0;
  let known = 0;
  let mistakes = 0;
  let attempts = 0;
  let correct = 0;
  for (const q of questions) {
    const s = stats[q.id];
    if (!s) continue;
    seen++;
    if (s.last === "c") known++;
    else mistakes++;
    attempts += s.seen;
    correct += s.correct;
  }
  return {
    total: questions.length,
    seen,
    known,
    mistakes,
    accuracy: attempts ? correct / attempts : null,
  };
}

export function isMistake(stats: State["stats"], qid: string) {
  return stats[qid]?.last === "w";
}

/** Questions sorted by how often they were answered wrong (most troublesome first). */
export function hardest(questions: readonly Question[], stats: State["stats"], limit = 50): Question[] {
  return questions
    .filter((q) => (stats[q.id]?.wrong ?? 0) > 0)
    .sort((a, b) => {
      const sa = stats[a.id];
      const sb = stats[b.id];
      const ra = sa.wrong / sa.seen;
      const rb = sb.wrong / sb.seen;
      return rb - ra || sb.wrong - sa.wrong;
    })
    .slice(0, limit);
}

export function percent(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}
