/**
 * Game rules for online rooms. Runs on the server, which keeps the secrets
 * and checks every move; players only ever receive viewFor() of the room.
 */

import { BULLS_LENGTHS, isValidCode, randomCode, scoreBulls } from "../bulls";
import { evaluateGuess, makeGuess } from "../evaluate";
import { LINGO_ROUNDS, lingoGuess, lingoStart } from "../lingo";
import { plural } from "../plural";
import { isOneOf, isRecord } from "../sanitize";
import { other, raceResult, type Seat } from "../turns";
import { MAX_GUESSES, WORD_LENGTH, isLang, isWordShape, loadDict, normalizeWord, randomAnswer } from "../words";
import {
  SOURCES,
  type LingoOnlineState,
  type RaceState,
  type Room,
  type RoomAction,
  type RoomData,
  type RoomView,
} from "./types";

type RaceRoom = Extract<Room, { game: "duel" | "bulls" }>;
type LingoRoom = Extract<Room, { game: "lingo" }>;

/** Bulls has no limit on guesses; this only stops a room from growing forever. */
const BULLS_MAX_GUESSES = 40;

const raceLobby = (): RaceState => ({
  phase: "lobby",
  secrets: ["", ""],
  guesses: [[], []],
  score: [0, 0],
  winner: null,
  round: 1,
});

/** A new room's game from the creator's settings, or null if they make no sense. */
export function parseRoomData(game: unknown, raw: unknown): RoomData | null {
  if (!isRecord(raw)) return null;
  if (game === "duel" && isLang(raw.lang) && isOneOf(raw.source, SOURCES)) {
    return { game, settings: { lang: raw.lang, source: raw.source }, state: raceLobby() };
  }
  if (game === "bulls" && isOneOf(raw.length, BULLS_LENGTHS) && isOneOf(raw.source, SOURCES)) {
    return { game, settings: { length: raw.length, source: raw.source }, state: raceLobby() };
  }
  if (game === "lingo" && isLang(raw.lang) && isOneOf(raw.rounds, LINGO_ROUNDS) && typeof raw.firstLetter === "boolean") {
    const state: LingoOnlineState = {
      phase: "lobby",
      rounds: raw.rounds,
      round: 1,
      answer: "",
      guesses: [],
      starter: 0,
      turn: 0,
      score: [0, 0],
      roundWinner: null,
      used: [],
    };
    return { game, settings: { lang: raw.lang, rounds: raw.rounds, firstLetter: raw.firstLetter }, state };
  }
  return null;
}

/** Called once the second player is in: leaves the lobby. */
export async function startGame(room: Room): Promise<Room> {
  if (room.state.phase !== "lobby") return room;
  if (room.game === "lingo") {
    const dict = await loadDict(room.settings.lang);
    return { ...room, state: lingoStart(room.state, randomAnswer(dict, room.state.used), 1, 0) };
  }
  return { ...room, state: await raceRound(room, 1) };
}

/**
 * Applies a player's move; a string is a refusal to show them. Returns the
 * same room object when the move changes nothing (a repeated tap).
 */
export async function act(room: Room, seat: Seat, action: RoomAction): Promise<Room | string> {
  if (room.state.phase === "lobby") return "Ждём второго игрока";
  return room.game === "lingo" ? actLingo(room, seat, action) : actRace(room, seat, action);
}

// ——— duel and bulls ———

async function raceRound(room: RaceRoom, round: number): Promise<RaceState> {
  const base = { ...room.state, round, guesses: [[], []] as [string[], string[]], winner: null };
  if (room.settings.source === "custom") return { ...base, phase: "secret", secrets: ["", ""] };
  return { ...base, phase: "play", secrets: await randomSecrets(room) };
}

async function randomSecrets(room: RaceRoom): Promise<[string, string]> {
  if (room.game === "bulls") return [randomCode(room.settings.length), randomCode(room.settings.length)];
  const dict = await loadDict(room.settings.lang);
  const first = randomAnswer(dict, room.state.secrets);
  return [first, randomAnswer(dict, [...room.state.secrets, first])];
}

const digits = (n: number) => `Нужно ${n} ${plural(n, ["разная цифра", "разные цифры", "разных цифр"])}`;

async function actRace(room: RaceRoom, seat: Seat, action: RoomAction): Promise<RaceRoom | string> {
  const s = room.state;
  const isDuel = room.game === "duel";

  if (action.type === "next") {
    if (action.round !== s.round) return room;
    if (s.phase !== "over") return "Игра ещё идёт";
    return { ...room, state: await raceRound(room, s.round + 1) };
  }

  const value = isDuel ? normalizeWord(action.value) : action.value.trim();
  const shapeError = isDuel
    ? isWordShape(value, room.settings.lang)
      ? null
      : `Нужно слово из ${WORD_LENGTH} букв`
    : isValidCode(value, room.settings.length)
      ? null
      : digits(room.settings.length);
  if (shapeError) return shapeError;

  if (action.type === "secret") {
    if (s.phase !== "secret") return "Сейчас загадывать не нужно";
    const target = other(seat);
    if (s.secrets[target]) return isDuel ? "Слово уже загадано" : "Число уже загадано";
    const secrets: [string, string] = [...s.secrets];
    secrets[target] = value;
    return { ...room, state: { ...s, secrets, phase: secrets[seat] ? "play" : "secret" } };
  }

  if (s.phase !== "play") return "Игра сейчас не идёт";
  const max = isDuel ? MAX_GUESSES : BULLS_MAX_GUESSES;
  const mine = s.guesses[seat];
  if (mine.at(-1) === s.secrets[seat]) return isDuel ? "Твоё слово уже найдено" : "Число уже отгадано";
  if (mine.length >= max) return "Попытки закончились";
  if (isDuel && value !== s.secrets[seat] && !(await loadDict(room.settings.lang)).allowed.has(value)) {
    return "Такого слова нет в словаре";
  }

  const guesses: [string[], string[]] = [[...s.guesses[0]], [...s.guesses[1]]];
  guesses[seat].push(value);
  const result = raceResult(
    [
      { tries: guesses[0].length, solved: guesses[0].at(-1) === s.secrets[0] },
      { tries: guesses[1].length, solved: guesses[1].at(-1) === s.secrets[1] },
    ],
    max,
  );
  if (result === undefined) return { ...room, state: { ...s, guesses } };
  const score: [number, number] = [...s.score];
  if (result !== null) score[result]++;
  return { ...room, state: { ...s, guesses, score, winner: result, phase: "over" } };
}

// ——— shared board ———

async function actLingo(room: LingoRoom, seat: Seat, action: RoomAction): Promise<LingoRoom | string> {
  const s = room.state;
  const dict = await loadDict(room.settings.lang);

  if (action.type === "next") {
    if (action.round !== s.round) return room;
    if (s.phase === "round") {
      return { ...room, state: lingoStart(s, randomAnswer(dict, s.used), s.round + 1, other(s.starter)) };
    }
    if (s.phase === "over") {
      return { ...room, state: lingoStart({ ...s, score: [0, 0] }, randomAnswer(dict, s.used), 1, other(s.starter)) };
    }
    return "Раунд ещё идёт";
  }
  if (action.type !== "guess") return "Здесь ничего загадывать не нужно";
  if (s.phase !== "play") return "Раунд уже закончился";
  if (seat !== s.turn) return "Сейчас ход соперника";

  const word = normalizeWord(action.value);
  if (!isWordShape(word, room.settings.lang)) return `Нужно слово из ${WORD_LENGTH} букв`;
  if (room.settings.firstLetter && word[0] !== s.answer[0]) {
    return `Слово должно начинаться на «${s.answer[0].toUpperCase()}»`;
  }
  if (word !== s.answer && !dict.allowed.has(word)) return "Такого слова нет в словаре";
  return { ...room, state: lingoGuess(s, word) };
}

// ——— views ———

/** What `seat` (null: not joined) gets to see of the room. */
export function viewFor(room: Room, version: number, seat: Seat | null): RoomView {
  const base = {
    code: room.code,
    version,
    me: seat,
    names: [room.players[0]?.name ?? null, room.players[1]?.name ?? null] as [string | null, string | null],
  };

  if (room.game === "lingo") {
    const s = room.state;
    const revealed = s.phase === "round" || s.phase === "over";
    return {
      ...base,
      game: "lingo",
      settings: room.settings,
      state: {
        phase: s.phase,
        round: s.round,
        turn: s.turn,
        starter: s.starter,
        score: s.score,
        roundWinner: s.roundWinner,
        guesses: s.guesses.map((g) => ({ ...g, marks: evaluateGuess(g.word, s.answer) })),
        first: room.settings.firstLetter && s.answer ? s.answer[0] : null,
        answer: revealed ? s.answer : null,
      },
    };
  }

  const s = room.state;
  const over = s.phase === "over";
  const race = {
    phase: s.phase,
    round: s.round,
    score: s.score,
    winner: s.winner,
    ready: [!!s.secrets[0], !!s.secrets[1]] as [boolean, boolean],
    secrets: s.secrets.map((secret, i) =>
      secret && (over || (seat !== null && i === other(seat))) ? secret : null,
    ) as [string | null, string | null],
  };

  if (room.game === "duel") {
    const boards = s.guesses.map((g, i) => g.map((w) => makeGuess(w, s.secrets[i])));
    return { ...base, game: "duel", settings: room.settings, state: { ...race, boards: [boards[0], boards[1]] } };
  }
  const boards = s.guesses.map((g, i) => g.map((code) => ({ code, ...scoreBulls(code, s.secrets[i]) })));
  return { ...base, game: "bulls", settings: room.settings, state: { ...race, boards: [boards[0], boards[1]] } };
}
