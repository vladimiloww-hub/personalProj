/** The shared-board game, used both on one phone and online. */

import { other, type Seat } from "./turns";
import { MAX_GUESSES } from "./words";

export const LINGO_ROUNDS = [3, 5, 7] as const;
export type LingoRounds = (typeof LINGO_ROUNDS)[number];

export interface LingoRound {
  rounds: number;
  round: number;
  answer: string;
  guesses: { word: string; by: Seat }[];
  starter: Seat;
  turn: Seat;
  score: [number, number];
  roundWinner: Seat | null;
  /** Answers already played this match, so none comes up twice. */
  used: string[];
}

export type LingoStep = "play" | "round" | "over";

/** Adds the current player's guess and passes the turn or closes the round. */
export function lingoGuess<T extends LingoRound>(s: T, word: string): T & { phase: LingoStep } {
  const guesses = [...s.guesses, { word, by: s.turn }];
  const solved = word === s.answer;
  if (!solved && guesses.length < MAX_GUESSES) return { ...s, guesses, turn: other(s.turn), phase: "play" };
  const score: [number, number] = [...s.score];
  if (solved) score[s.turn]++;
  // Stop early once the trailing player can't catch up any more.
  const decided = Math.abs(score[0] - score[1]) > s.rounds - s.round;
  return {
    ...s,
    guesses,
    score,
    roundWinner: solved ? s.turn : null,
    phase: s.round >= s.rounds || decided ? "over" : "round",
  };
}

/** Starts a round with the given hidden word. */
export function lingoStart<T extends LingoRound>(s: T, answer: string, round: number, starter: Seat): T & { phase: "play" } {
  return {
    ...s,
    phase: "play",
    round,
    answer,
    starter,
    turn: starter,
    guesses: [],
    roundWinner: null,
    used: [...s.used, answer].slice(-200),
  };
}
