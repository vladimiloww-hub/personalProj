/**
 * Turn order shared by the duel-style games: in every round the starter
 * guesses first and the other player answers with the same number of
 * guesses, so nobody wins just by moving first.
 */

export type Seat = 0 | 1;

export type TurnResult =
  | { over: false; turn: Seat }
  | { over: true; winner: Seat | null };

export function other(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

/**
 * Who moves next after a guess.
 * @param counts guesses made by each player so far (including this one)
 * @param solved whether each player has found their word
 * @param maxGuesses guesses each player gets, or null for no limit
 */
export function afterGuess(
  counts: [number, number],
  solved: [boolean, boolean],
  starter: Seat,
  maxGuesses: number | null,
): TurnResult {
  if (counts[0] !== counts[1]) return { over: false, turn: other(starter) };
  if (solved[0] && solved[1]) return { over: true, winner: null };
  if (solved[0]) return { over: true, winner: 0 };
  if (solved[1]) return { over: true, winner: 1 };
  if (maxGuesses !== null && counts[0] >= maxGuesses) return { over: true, winner: null };
  return { over: false, turn: starter };
}
