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
  /** Set for a puzzle from a custom pack (then `date` is empty). */
  pack?: { id: string; title: string; total: number };
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

// ——— custom puzzles (packs) ———

/** A puzzle as an author writes it: four groups, easiest first. */
export interface PuzzleSpec {
  groups: { title: string; words: string[] }[];
}

export const WORD_MAX = 14;
export const GROUP_TITLE_MAX = 80;
export const PACK_TITLE_MAX = 60;
export const PACK_PUZZLES_MAX = 400;

const WORD_RE = /^[\p{L}\p{N}][\p{L}\p{N} '’-]*$/u;

/** Words are shown in capitals with single spaces. */
export function cleanWord(word: string): string {
  return word.trim().replace(/\s+/g, " ").toUpperCase();
}

export function cleanSpec(spec: PuzzleSpec): PuzzleSpec {
  return {
    groups: spec.groups.map((g) => ({
      title: g.title.trim().replace(/\s+/g, " "),
      words: g.words.map(cleanWord),
    })),
  };
}

/** What's wrong with a puzzle, in words for its author; empty when it's fine. */
export function puzzleProblems(spec: PuzzleSpec): string[] {
  const problems: string[] = [];
  if (spec.groups.length !== 4) return ["Нужно ровно 4 группы"];
  const seen = new Map<string, number>();
  spec.groups.forEach((g, i) => {
    const name = `Группа ${i + 1}`;
    if (!g.title.trim()) problems.push(`${name}: нет названия`);
    if (g.title.length > GROUP_TITLE_MAX) problems.push(`${name}: название длиннее ${GROUP_TITLE_MAX} символов`);
    const filled = g.words.map(cleanWord).filter(Boolean);
    if (g.words.length !== 4) problems.push(`${name}: нужно 4 слова, а не ${g.words.length}`);
    else if (filled.length < 4) problems.push(`${name}: заполнено ${filled.length} из 4 слов`);
    for (const w of filled) {
      if (w.length > WORD_MAX) problems.push(`${name}: «${w}» длиннее ${WORD_MAX} символов`);
      else if (!WORD_RE.test(w)) problems.push(`${name}: «${w}» — только буквы, цифры, пробел и дефис`);
      seen.set(w, (seen.get(w) ?? 0) + 1);
    }
  });
  for (const [word, n] of seen) if (n > 1) problems.push(`«${word}» встречается ${n} раза`);
  return problems;
}

/** A small seeded generator, so every player gets the same starting layout. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPuzzle(spec: PuzzleSpec, number: number, date: string, seed: number): ConnPuzzle {
  const groups = spec.groups.map((g, level) => ({ level: level as Level, title: g.title, words: g.words }));
  const order = groups.flatMap((g) => g.words);
  const random = seeded(seed);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { number, date, groups, order };
}

/**
 * The text format for writing packs by hand:
 *
 *   # Название пака            ← optional, first line
 *   Ягоды: малина, брусника, клюква, черника
 *   Города на Волге: казань, саратов, тверь, ярославль
 *   …                          ← four lines per puzzle, easiest group first
 *                              ← an empty line between puzzles
 */
export function parsePackText(text: string): { title?: string; puzzles: PuzzleSpec[]; errors: string[] } {
  const lines = text.replace(/\r/g, "").split("\n");
  const errors: string[] = [];
  const puzzles: PuzzleSpec[] = [];
  let title: string | undefined;
  let block: { line: number; text: string }[] = [];

  const flush = () => {
    if (!block.length) return;
    const where = `Головоломка ${puzzles.length + errors.length + 1} (строка ${block[0].line})`;
    if (block.length !== 4) {
      errors.push(`${where}: нужно 4 строки-группы, а их ${block.length}`);
    } else {
      const groups: PuzzleSpec["groups"] = [];
      for (const { line, text: row } of block) {
        const colon = row.indexOf(":");
        if (colon < 0) {
          errors.push(`${where}: в строке ${line} нет двоеточия между названием и словами`);
          block = [];
          return;
        }
        groups.push({
          title: row.slice(0, colon),
          words: row
            .slice(colon + 1)
            .split(/[,;]/)
            .map((w) => w.trim())
            .filter(Boolean),
        });
      }
      const spec = cleanSpec({ groups });
      const problems = puzzleProblems(spec);
      if (problems.length) errors.push(`${where}: ${problems.join("; ")}`);
      else puzzles.push(spec);
    }
    block = [];
  };

  lines.forEach((raw, i) => {
    const row = raw.trim();
    if (!row) return flush();
    if (row.startsWith("#")) {
      if (title === undefined && !puzzles.length && !block.length) title = row.replace(/^#+/, "").trim();
      return;
    }
    block.push({ line: i + 1, text: row });
  });
  flush();
  return { title, puzzles, errors };
}

export function packToText(title: string, puzzles: PuzzleSpec[]): string {
  const body = puzzles.map((p) => p.groups.map((g) => `${g.title}: ${g.words.join(", ")}`).join("\n")).join("\n\n");
  return `# ${title}\n\n${body}\n`;
}

/** Accepts an exported pack ({ title, puzzles }) or a bare list of puzzles. */
export function parsePackJson(text: string): { title?: string; puzzles: PuzzleSpec[]; errors: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { puzzles: [], errors: ["Это не JSON"] };
  }
  const record = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(raw) ? raw : record && Array.isArray(record.puzzles) ? record.puzzles : null;
  if (!list) return { puzzles: [], errors: ["Не нашлось списка головоломок (puzzles)"] };
  const puzzles: PuzzleSpec[] = [];
  const errors: string[] = [];
  list.forEach((item, i) => {
    const groups = (item as { groups?: unknown })?.groups;
    const ok =
      Array.isArray(groups) &&
      groups.every(
        (g) => typeof g?.title === "string" && Array.isArray(g?.words) && g.words.every((w: unknown) => typeof w === "string"),
      );
    if (!ok) return void errors.push(`Головоломка ${i + 1}: непонятный формат`);
    const spec = cleanSpec({ groups: groups as PuzzleSpec["groups"] });
    const problems = puzzleProblems(spec);
    if (problems.length) errors.push(`Головоломка ${i + 1}: ${problems.join("; ")}`);
    else puzzles.push(spec);
  });
  return { title: typeof record?.title === "string" ? record.title : undefined, puzzles, errors };
}
