/** Wordle scoring: which letters of a guess are in place, elsewhere, or absent. */

export type Mark = "correct" | "present" | "absent";

export interface Guess {
  word: string;
  marks: Mark[];
}

/**
 * Marks a guess against the answer. Repeated letters are only marked as many
 * times as the answer has them: exact matches first, then left to right.
 */
export function evaluateGuess(guess: string, answer: string): Mark[] {
  const g = Array.from(guess);
  const a = Array.from(answer);
  const marks: Mark[] = g.map(() => "absent");
  const left = new Map<string, number>();

  g.forEach((ch, i) => {
    if (ch === a[i]) marks[i] = "correct";
    else left.set(a[i], (left.get(a[i]) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (marks[i] === "correct") return;
    const n = left.get(ch) ?? 0;
    if (n > 0) {
      marks[i] = "present";
      left.set(ch, n - 1);
    }
  });
  return marks;
}

export function makeGuess(word: string, answer: string): Guess {
  return { word, marks: evaluateGuess(word, answer) };
}

export function isSolved(guess: Guess | undefined): boolean {
  return !!guess && guess.marks.every((m) => m === "correct");
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

/** Best known state of every letter used so far, for colouring the keyboard. */
export function keyStates(guesses: Guess[]): Record<string, Mark> {
  const states: Record<string, Mark> = {};
  for (const { word, marks } of guesses) {
    Array.from(word).forEach((ch, i) => {
      const prev = states[ch];
      if (!prev || RANK[marks[i]] > RANK[prev]) states[ch] = marks[i];
    });
  }
  return states;
}

const EMOJI: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬜" };

/** The familiar spoiler-free grid of coloured squares. */
export function emojiGrid(guesses: Guess[]): string {
  return guesses.map((g) => g.marks.map((m) => EMOJI[m]).join("")).join("\n");
}
