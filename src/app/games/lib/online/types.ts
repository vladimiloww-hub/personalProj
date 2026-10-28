/**
 * Online rooms: shapes shared by the API routes (which own the full room,
 * secrets included) and the pages (which only ever get a player's view).
 */

import type { BullsGuess, BullsLength } from "../bulls";
import type { Guess, Mark } from "../evaluate";
import type { LingoRound, LingoRounds } from "../lingo";
import type { Seat } from "../turns";
import type { Lang } from "../words";

export const ONLINE_GAMES = ["duel", "lingo", "bulls"] as const;
export type OnlineGame = (typeof ONLINE_GAMES)[number];

export const SOURCES = ["custom", "random"] as const;
export type Source = (typeof SOURCES)[number];

export interface DuelSettings {
  lang: Lang;
  source: Source;
}
export interface LingoSettings {
  lang: Lang;
  rounds: LingoRounds;
  firstLetter: boolean;
}
export interface BullsSettings {
  length: BullsLength;
  source: Source;
}

/** Duel and bulls online: both guess at their own pace, fewer guesses wins. */
export interface RaceState {
  phase: "lobby" | "secret" | "play" | "over";
  /** secrets[i] is what player i is looking for. */
  secrets: [string, string];
  guesses: [string[], string[]];
  score: [number, number];
  winner: Seat | null;
  round: number;
}

export interface LingoOnlineState extends LingoRound {
  phase: "lobby" | "play" | "round" | "over";
}

export type RoomData =
  | { game: "duel"; settings: DuelSettings; state: RaceState }
  | { game: "bulls"; settings: BullsSettings; state: RaceState }
  | { game: "lingo"; settings: LingoSettings; state: LingoOnlineState };

export interface Player {
  name: string;
  /** Secret handed to the player's browser; it proves which seat a request is from. */
  token: string;
}

export type Room = RoomData & {
  code: string;
  players: [Player | null, Player | null];
};

export type RoomAction =
  | { type: "secret"; value: string }
  | { type: "guess"; value: string }
  /**
   * Next round (shared board) or a rematch once the game is over. `round` is
   * the round the player saw, so two taps at once only move on once.
   */
  | { type: "next"; round: number };

// ——— what a player is allowed to see ———

export interface RaceView<G> {
  phase: RaceState["phase"];
  round: number;
  score: [number, number];
  winner: Seat | null;
  /** Each player's rows, already marked against their own word. */
  boards: [G[], G[]];
  /** Whose secret is already set. */
  ready: [boolean, boolean];
  /** Secrets this player may see: the opponent's target, and both once it's over. */
  secrets: [string | null, string | null];
}

export interface LingoView {
  phase: LingoOnlineState["phase"];
  round: number;
  turn: Seat;
  starter: Seat;
  score: [number, number];
  roundWinner: Seat | null;
  guesses: { word: string; by: Seat; marks: Mark[] }[];
  /** The open first letter, when that rule is on. */
  first: string | null;
  /** Shown once the round is over. */
  answer: string | null;
}

export type GameView =
  | { game: "duel"; settings: DuelSettings; state: RaceView<Guess> }
  | { game: "bulls"; settings: BullsSettings; state: RaceView<BullsGuess> }
  | { game: "lingo"; settings: LingoSettings; state: LingoView };

export type RoomView = GameView & {
  code: string;
  version: number;
  names: [string | null, string | null];
  /** The viewer's seat, or null for someone who hasn't joined. */
  me: Seat | null;
};

export const GAME_TITLES: Record<OnlineGame, string> = {
  duel: "Вордл-дуэль",
  lingo: "Общая доска",
  bulls: "Быки и коровы",
};

/** Room codes avoid look-alike characters (0/O, 1/I). */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 5;

/** Realtime channel the server pings after every change to a room. */
export const roomTopic = (code: string) => `games:${code}`;

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

export function isRoomCode(code: string): boolean {
  return code.length === CODE_LENGTH && Array.from(code).every((c) => CODE_ALPHABET.includes(c));
}
