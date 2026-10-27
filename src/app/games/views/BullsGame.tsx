"use client";

import { useEffect, useRef, useState } from "react";
import Board from "../components/Board";
import DigitPad from "../components/DigitPad";
import SecretEntry from "../components/SecretEntry";
import {
  Button,
  GameScreen,
  Handoff,
  NameFields,
  Page,
  PlayArea,
  RulesButton,
  ScoreBar,
  Segmented,
  Sheet,
  StatusLine,
  TopBar,
  useToast,
} from "../components/ui";
import { BULLS_LENGTHS, isValidCode, randomCode, scoreBulls, type BullsLength } from "../lib/bulls";
import { BACK, ENTER, digitFromEvent } from "../lib/keys";
import { persisted } from "../lib/persist";
import { DEFAULT_NAMES, cleanName, playerNames } from "../lib/players";
import { MOVES, plural } from "../lib/plural";
import { isCount, isOneOf, isPair, isRecord, isSeat, isString, isStrings } from "../lib/sanitize";
import { afterGuess, other, type Seat } from "../lib/turns";
import { useKeys } from "../lib/useKeys";

const PHASES = ["setup", "secret", "handoff", "play", "over"] as const;
const SOURCES = ["custom", "random"] as const;

/** Per-digit notes a player keeps about the opponent's number. */
const NOTE_STATES = ["", "no", "yes"] as const;
type Note = (typeof NOTE_STATES)[number];

interface BullsState {
  phase: (typeof PHASES)[number];
  names: [string, string];
  source: (typeof SOURCES)[number];
  length: BullsLength;
  /** secrets[i] is the number player i is looking for. */
  secrets: [string, string];
  guesses: [string[], string[]];
  starter: Seat;
  turn: Seat;
  setter: Seat;
  score: [number, number];
  winner: Seat | null;
  notes: [Note[], Note[]];
}

const blankNotes = (): [Note[], Note[]] => [Array(10).fill(""), Array(10).fill("")];

const FRESH: BullsState = {
  phase: "setup",
  names: DEFAULT_NAMES,
  source: "custom",
  length: 4,
  secrets: ["", ""],
  guesses: [[], []],
  starter: 0,
  turn: 0,
  setter: 0,
  score: [0, 0],
  winner: null,
  notes: blankNotes(),
};

const isNotes = (v: unknown): v is Note[] =>
  Array.isArray(v) && v.length === 10 && v.every((n) => isOneOf(n, NOTE_STATES));

const store = persisted<BullsState>("games:bulls", FRESH, (raw) => {
  if (
    !isRecord(raw) ||
    !isOneOf(raw.phase, PHASES) ||
    !isPair(raw.names, isString) ||
    !isOneOf(raw.source, SOURCES) ||
    !isOneOf(raw.length, BULLS_LENGTHS) ||
    !isPair(raw.secrets, isString) ||
    !isPair(raw.guesses, isStrings) ||
    !isSeat(raw.starter) ||
    !isSeat(raw.turn) ||
    !isSeat(raw.setter) ||
    !isPair(raw.score, isCount) ||
    !(raw.winner === null || isSeat(raw.winner)) ||
    !isPair(raw.notes, isNotes)
  ) {
    return null;
  }
  return raw as unknown as BullsState;
});

function withGuess(s: BullsState, code: string): BullsState {
  const guesses: [string[], string[]] = [[...s.guesses[0]], [...s.guesses[1]]];
  guesses[s.turn].push(code);
  const solved: [boolean, boolean] = [guesses[0].at(-1) === s.secrets[0], guesses[1].at(-1) === s.secrets[1]];
  const next = afterGuess([guesses[0].length, guesses[1].length], solved, s.starter, null);
  if (!next.over) return { ...s, guesses, turn: next.turn };
  const score: [number, number] = [...s.score];
  if (next.winner !== null) score[next.winner]++;
  return { ...s, guesses, score, winner: next.winner, phase: "over" };
}

function freshRound(s: BullsState, starter: Seat): BullsState {
  const base = { ...s, starter, turn: starter, guesses: [[], []] as [string[], string[]], winner: null, notes: blankNotes() };
  return s.source === "custom"
    ? { ...base, phase: "secret", secrets: ["", ""], setter: starter }
    : { ...base, phase: "play", secrets: [randomCode(s.length), randomCode(s.length)] };
}

export default function BullsGame() {
  const s = store.use();
  const hydrated = store.useHydrated();

  const rules = (
    <RulesButton title="Быки и коровы">
      <p>
        Каждый загадывает число из {s.length} <b>разных</b> цифр (можно начинать с нуля) — или берёте случайные. Дальше
        по очереди пытаетесь отгадать число соперника.
      </p>
      <p>
        <b className="text-wg-correct">Бык</b> — цифра стоит на своём месте. <b className="text-wg-present">Корова</b> —
        цифра есть в числе, но в другом месте.
      </p>
      <p className="rounded-xl bg-wg-surface-2 p-3 text-sm">
        Загадано <b>1234</b>, ход <b>1356</b> → 1 бык (1) и 1 корова (3).
      </p>
      <p>
        Отмечай цифры в заметках: одно нажатие — «точно нет», второе — «точно есть», третье — снять отметку.
      </p>
      <p>Побеждает тот, кто первым соберёт всех быков. Ходы идут парами, так что второй игрок успевает ответить.</p>
    </RulesButton>
  );

  if (!hydrated) return <GameScreen><TopBar title="Быки и коровы" /></GameScreen>;

  return (
    <GameScreen>
      <TopBar title="Быки и коровы" right={rules} />
      {s.phase === "setup" && <Setup state={s} />}
      {s.phase === "secret" && (
        <SecretEntry
          key={s.setter}
          kind={{ type: "code", length: s.length }}
          seat={s.setter}
          title={`${s.names[s.setter]}, загадай число`}
          onSubmit={(code) =>
            store.set((prev) => {
              const secrets: [string, string] = [...prev.secrets];
              secrets[other(prev.setter)] = code;
              return secrets[prev.setter]
                ? { ...prev, secrets, phase: "play", turn: prev.starter }
                : { ...prev, secrets, phase: "handoff", setter: other(prev.setter) };
            })
          }
        >
          {s.length} {plural(s.length, ["разная цифра", "разные цифры", "разных цифр"])}. Отгадывать будет <b className="text-wg-text">{s.names[other(s.setter)]}</b> — пусть
          пока отвернётся.
        </SecretEntry>
      )}
      {s.phase === "handoff" && (
        <Handoff seat={s.setter} name={s.names[s.setter]} onReady={() => store.set((prev) => ({ ...prev, phase: "secret" }))}>
          Теперь твоя очередь загадать число для соперника.
        </Handoff>
      )}
      {(s.phase === "play" || s.phase === "over") && <Play state={s} />}
    </GameScreen>
  );
}

function Setup({ state: s }: { state: BullsState }) {
  const names = playerNames.use();

  const start = () => {
    const clean: [string, string] = [cleanName(names[0], DEFAULT_NAMES[0]), cleanName(names[1], DEFAULT_NAMES[1])];
    playerNames.set(clean);
    store.set(freshRound({ ...s, names: clean, score: [0, 0] }, 0));
  };

  return (
    <Page>
      <div>
        <h2 className="font-wg-display text-2xl font-extrabold">Классика, с которой начался Вордл</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-wg-muted">
          Загадайте друг другу числа и отгадывайте по очереди. Подсказки — только «быки» и «коровы», так что придётся
          подумать.
        </p>
      </div>
      <NameFields names={names} onChange={playerNames.set} />
      <Segmented
        label="Сколько цифр"
        value={s.length}
        options={BULLS_LENGTHS.map((n) => ({ value: n, label: `${n} ${plural(n, ["цифра", "цифры", "цифр"])}` }))}
        onChange={(length) => store.set((prev) => ({ ...prev, length }))}
      />
      <Segmented
        label="Числа"
        value={s.source}
        options={[
          { value: "custom", label: "Загадываем сами" },
          { value: "random", label: "Случайные" },
        ]}
        onChange={(source) => store.set((prev) => ({ ...prev, source }))}
      />
      <Button onClick={start}>Начать</Button>
    </Page>
  );
}

function Play({ state: s }: { state: BullsState }) {
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();
  const lists = useRef<(HTMLOListElement | null)[]>([]);

  const over = s.phase === "over";
  const counts = `${s.guesses[0].length}-${s.guesses[1].length}`;

  useEffect(() => {
    lists.current.forEach((el) => el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [counts]);

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = () => {
    if (over) return;
    if (!isValidCode(current, s.length)) {
      return reject(current.length < s.length ? "Мало цифр" : "Цифры не должны повторяться");
    }
    const seat = s.turn;
    setCurrent("");
    store.set((prev) => withGuess(prev, current));
    const next = store.get();
    if (next.phase === "play" && next.turn !== seat) showToast(`Ход: ${next.names[next.turn]}`, 1200);
  };

  const press = (key: string) => {
    if (over) return;
    if (key === ENTER) return submit();
    if (key === BACK) setCurrent((c) => c.slice(0, -1));
    else setCurrent((c) => (c.length < s.length && !c.includes(key) ? c + key : c));
  };

  useKeys(press, digitFromEvent, !over);

  const toggleNote = (digit: number) =>
    store.set((prev) => {
      const notes: [Note[], Note[]] = [[...prev.notes[0]], [...prev.notes[1]]];
      const mine = notes[prev.turn];
      mine[digit] = NOTE_STATES[(NOTE_STATES.indexOf(mine[digit]) + 1) % NOTE_STATES.length];
      return { ...prev, notes };
    });

  const leader = !over ? ([0, 1] as const).find((seat) => s.guesses[seat].at(-1) === s.secrets[seat]) : undefined;

  return (
    <PlayArea>
      <ScoreBar names={s.names} score={s.score} turn={over ? null : s.turn} />
      <div className="flex min-h-0 flex-1 gap-2 px-3 pt-3 sm:gap-6 sm:px-6">
        {([0, 1] as const).map((seat) => {
          const active = !over && seat === s.turn;
          return (
            <section
              key={seat}
              className={`wg-p${seat} flex min-w-0 flex-1 flex-col gap-2 transition-opacity duration-300 ${
                over || active ? "" : "opacity-55"
              }`}
              aria-label={`Ходы: ${s.names[seat]}`}
            >
              <div className="flex items-center gap-1.5 px-1 text-[13px]">
                <span className="size-2 shrink-0 rounded-full bg-wg-pc" aria-hidden />
                <b className="min-w-0 truncate">{s.names[seat]}</b>
                {active && <span className="wg-turn ml-auto shrink-0 font-bold text-wg-pc">ходит</span>}
              </div>
              <ol
                ref={(el) => {
                  lists.current[seat] = el;
                }}
                className={`min-h-0 flex-1 overflow-y-auto rounded-xl border bg-wg-surface py-1 ${
                  active ? "border-wg-pc" : "border-wg-line"
                }`}
              >
                {s.guesses[seat].length === 0 && (
                  <li className="px-3 py-3 text-center text-[13px] text-wg-muted">Пока без ходов</li>
                )}
                {s.guesses[seat].map((code, i) => {
                  const { bulls, cows } = scoreBulls(code, s.secrets[seat]);
                  return (
                    <li key={i} className="flex items-center gap-2 px-2 py-1 sm:px-3">
                      <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-wg-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1 font-mono text-[clamp(15px,4.4vw,20px)] font-bold tracking-[0.12em]">
                        {code}
                      </span>
                      <span className="flex shrink-0 gap-1 text-[12px] font-bold tabular-nums">
                        <Count n={bulls} letter="Б" color="bg-wg-correct" label={plural(bulls, ["бык", "быка", "быков"])} />
                        <Count n={cows} letter="К" color="bg-wg-present" label={plural(cows, ["корова", "коровы", "коров"])} />
                      </span>
                    </li>
                  );
                })}
              </ol>
              {over && (
                <p className="text-center text-[13px] text-wg-muted">
                  Число: <b className="font-mono tracking-wider text-wg-text">{s.secrets[seat]}</b>
                </p>
              )}
            </section>
          );
        })}
      </div>
      <StatusLine toast={toast}>
        {leader !== undefined
          ? `${s.names[leader]} — все быки! ${s.names[other(leader)]}, последний шанс на ничью`
          : over
            ? ""
            : `Ход ${s.guesses[s.turn].length + 1}`}
      </StatusLine>
      <div className="shrink-0 space-y-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {over ? (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
            <Button variant="secondary" onClick={() => setResultClosed(false)}>
              Итоги
            </Button>
            <Button
              onClick={() => {
                setResultClosed(false);
                store.set((prev) => freshRound(prev, other(prev.starter)));
              }}
            >
              Реванш
            </Button>
          </div>
        ) : (
          <div className={`wg-p${s.turn} space-y-2`}>
            <div className="mx-auto h-[clamp(44px,12vw,56px)] w-[min(70vw,260px)]">
              <div className="wg-fit size-full">
                <Board guesses={[]} rows={1} cols={s.length} active current={current} shake={shake} maxWidth={260} />
              </div>
            </div>
            <Notes notes={s.notes[s.turn]} onToggle={toggleNote} />
            <DigitPad onKey={press} used={current} />
          </div>
        )}
      </div>
      <Sheet open={over && !resultClosed} onClose={() => setResultClosed(true)}>
        <Result state={s} />
      </Sheet>
    </PlayArea>
  );
}

function Count({ n, letter, color, label }: { n: number; letter: string; color: string; label: string }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 ${n > 0 ? `${color} text-white` : "bg-wg-surface-2 text-wg-muted"}`}
      aria-label={`${n} ${label}`}
    >
      {n}
      {letter}
    </span>
  );
}

function Notes({ notes, onToggle }: { notes: Note[]; onToggle: (digit: number) => void }) {
  return (
    <div className="mx-auto w-full max-w-[420px] px-1.5">
      <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-wg-muted">Заметки</p>
      <div className="grid grid-cols-10 gap-1">
        {notes.map((note, d) => (
          <button
            key={d}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggle(d)}
            aria-label={`Цифра ${d}: ${note === "no" ? "точно нет" : note === "yes" ? "точно есть" : "без отметки"}`}
            className={`h-8 rounded-md border font-mono text-sm font-bold transition ${
              note === "no"
                ? "border-transparent bg-wg-surface-2 text-wg-muted line-through opacity-60"
                : note === "yes"
                  ? "border-wg-correct bg-wg-correct text-white"
                  : "border-wg-line bg-wg-surface text-wg-text"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ state: s }: { state: BullsState }) {
  const moves = s.guesses[0].length;
  return (
    <div className="text-center">
      {s.winner !== null ? (
        <div className={`wg-p${s.winner}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wg-muted">Победа</p>
          <p className="mt-1 font-wg-display text-3xl font-extrabold text-wg-pc">{s.names[s.winner]}</p>
          <p className="mt-2 text-wg-muted">
            Число отгадано за {moves} {plural(moves, MOVES)}
          </p>
        </div>
      ) : (
        <div>
          <p className="font-wg-display text-3xl font-extrabold">Ничья</p>
          <p className="mt-2 text-wg-muted">
            Оба числа отгаданы за {moves} {plural(moves, MOVES)}
          </p>
        </div>
      )}
      <p className="mt-5 text-[13px] font-semibold text-wg-muted">Какие числа искали</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-left">
        {([0, 1] as const).map((seat) => (
          <div key={seat} className={`wg-p${seat} rounded-xl bg-wg-surface-2 p-3`}>
            <p className="truncate text-[13px] font-semibold text-wg-pc">{s.names[seat]}</p>
            <p className="mt-0.5 font-mono text-xl font-extrabold tracking-widest">{s.secrets[seat]}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 font-wg-display text-lg font-extrabold tabular-nums">
        {s.score[0]} : {s.score[1]}
      </p>
      <div className="mt-4 grid gap-2">
        <Button onClick={() => store.set((prev) => freshRound(prev, other(prev.starter)))}>Реванш</Button>
        <Button variant="ghost" onClick={() => store.set((prev) => ({ ...prev, phase: "setup" }))}>
          Новая игра
        </Button>
      </div>
    </div>
  );
}
