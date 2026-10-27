/** Bulls and cows: guess the opponent's secret number with distinct digits. */

export const BULLS_LENGTHS = [3, 4, 5] as const;
export type BullsLength = (typeof BULLS_LENGTHS)[number];

export interface BullsGuess {
  code: string;
  bulls: number;
  cows: number;
}

/** Bulls: right digit in the right place. Cows: right digit, wrong place. */
export function scoreBulls(guess: string, secret: string): { bulls: number; cows: number } {
  let bulls = 0;
  let cows = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) bulls++;
    else if (secret.includes(guess[i])) cows++;
  }
  return { bulls, cows };
}

export function isValidCode(code: string, length: number): boolean {
  return code.length === length && /^\d+$/.test(code) && new Set(code).size === length;
}

export function randomCode(length: number): string {
  const digits = "0123456789".split("");
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}
