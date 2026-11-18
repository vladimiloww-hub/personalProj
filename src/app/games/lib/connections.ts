/**
 * «Связи» (like NYT Connections): sixteen words, four hidden groups of four.
 * Pure rules shared by the API (which builds a day's puzzle) and the page.
 */

export const MAX_MISTAKES = 4;
/** Day №1. A new puzzle starts at local midnight. */
export const LAUNCH_DATE = "2026-11-18";

export type Level = 0 | 1 | 2 | 3;

export interface ConnGroup {
  level: Level;
  title: string;
  words: string[];
}

export interface ConnPuzzle {
  number: number;
  date: string;
  groups: ConnGroup[];
  /** The sixteen words in their starting layout (the same for everyone). */
  order: string[];
}

export const LEVEL_EMOJI = ["🟨", "🟩", "🟦", "🟪"] as const;
export const LEVEL_NAMES = ["жёлтая", "зелёная", "синяя", "фиолетовая"] as const;

// ——— dates (YYYY-MM-DD, compared as strings) ———

const DAY_MS = 86_400_000;

export function isDateKey(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().startsWith(s);
}

/** The local calendar date of `d`. */
export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const utc = (key: string) => Date.parse(`${key}T00:00:00Z`);

export function addDays(key: string, days: number): string {
  return new Date(utc(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Puzzle number of a date: 1 on launch day. */
export function dayNumber(key: string): number {
  return Math.round((utc(key) - utc(LAUNCH_DATE)) / DAY_MS) + 1;
}

// ——— guesses ———

export function sameWords(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((w) => b.includes(w));
}

export type Outcome =
  | { kind: "correct"; group: ConnGroup }
  /** Three of the four belong together. */
  | { kind: "one-away" }
  | { kind: "wrong" }
  /** Already tried: costs nothing. */
  | { kind: "repeat" };

export function judge(puzzle: ConnPuzzle, earlier: string[][], guess: string[]): Outcome {
  if (earlier.some((g) => sameWords(g, guess))) return { kind: "repeat" };
  const group = puzzle.groups.find((g) => sameWords(g.words, guess));
  if (group) return { kind: "correct", group };
  const best = Math.max(...puzzle.groups.map((g) => guess.filter((w) => g.words.includes(w)).length));
  return best === 3 ? { kind: "one-away" } : { kind: "wrong" };
}

export interface Progress {
  /** Groups found, in the order they were found. */
  solved: ConnGroup[];
  mistakes: number;
  over: boolean;
  won: boolean;
  /** The guesses that counted (repeats dropped). */
  counted: string[][];
}

/** Replays saved guesses into the game's state. */
export function replay(puzzle: ConnPuzzle, guesses: string[][]): Progress {
  const solved: ConnGroup[] = [];
  const counted: string[][] = [];
  let mistakes = 0;
  for (const guess of guesses) {
    if (solved.length === puzzle.groups.length || mistakes >= MAX_MISTAKES) break;
    const outcome = judge(puzzle, counted, guess);
    if (outcome.kind === "repeat") continue;
    counted.push(guess);
    if (outcome.kind === "correct") solved.push(outcome.group);
    else mistakes++;
  }
  const won = solved.length === puzzle.groups.length;
  return { solved, mistakes, won, over: won || mistakes >= MAX_MISTAKES, counted };
}

/** Rows of coloured squares for sharing, one per guess. */
export function emojiRows(puzzle: ConnPuzzle, guesses: string[][]): string {
  const levelOf = (w: string) => puzzle.groups.find((g) => g.words.includes(w))?.level ?? 0;
  return guesses.map((g) => g.map((w) => LEVEL_EMOJI[levelOf(w)]).join("")).join("\n");
}
