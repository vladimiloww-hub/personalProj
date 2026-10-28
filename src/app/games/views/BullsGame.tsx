"use client";

import { useState } from "react";
import Board from "../components/Board";
import DigitPad from "../components/DigitPad";
import { MyName, OnlineError, WhereToPlay, useOnlineStart, type Where } from "../components/OnlineStart";
import SecretEntry from "../components/SecretEntry";
import { BullsColumn, Notes, SecretsGrid, Verdict } from "../components/panels";
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
import {
  BULLS_LENGTHS,
  NOTE_STATES,
  blankNotes,
  isValidCode,
  nextNote,
  randomCode,
  scoreBulls,
  type BullsLength,
  type Note,
} from "../lib/bulls";
import { BACK, ENTER, digitFromEvent } from "../lib/keys";
import { persisted } from "../lib/persist";
import { DEFAULT_NAMES, cleanName, playerNames } from "../lib/players";
import { MOVES, plural } from "../lib/plural";
import { isCount, isOneOf, isPair, isRecord, isSeat, isString, isStrings } from "../lib/sanitize";
import { afterGuess, other, type Seat } from "../lib/turns";
import { useKeys } from "../lib/useKeys";

const PHASES = ["setup", "secret", "handoff", "play", "over"] as const;
const SOURCES = ["custom", "random"] as const;

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

const blankPair = (): [Note[], Note[]] => [blankNotes(), blankNotes()];

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
  notes: blankPair(),
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
  const base = { ...s, starter, turn: starter, guesses: [[], []] as [string[], string[]], winner: null, notes: blankPair() };
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
  const [where, setWhere] = useState<Where>("local");
  const online = useOnlineStart("bulls");

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
      <WhereToPlay value={where} onChange={setWhere} />
      {where === "local" ? <NameFields names={names} onChange={playerNames.set} /> : <MyName />}
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
      {where === "local" ? (
        <Button onClick={start}>Начать</Button>
      ) : (
        <Button onClick={() => online.start({ length: s.length, source: s.source })} disabled={online.busy}>
          Создать комнату
        </Button>
      )}
      <OnlineError error={online.error} />
    </Page>
  );
}

function Play({ state: s }: { state: BullsState }) {
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();

  const over = s.phase === "over";

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
      mine[digit] = nextNote(mine[digit]);
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
            <BullsColumn
              key={seat}
              seat={seat}
              name={s.names[seat]}
              guesses={s.guesses[seat].map((code) => ({ code, ...scoreBulls(code, s.secrets[seat]) }))}
              active={active}
              dim={!over && !active}
              badge={active && <span className="wg-turn">ходит</span>}
              footer={
                over && (
                  <>
                    Число: <b className="font-mono tracking-wider text-wg-text">{s.secrets[seat]}</b>
                  </>
                )
              }
            />
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

function Result({ state: s }: { state: BullsState }) {
  const moves = s.guesses[0].length;
  return (
    <div className="text-center">
      <Verdict winner={s.winner} names={s.names}>
        {s.winner !== null ? "Число отгадано" : "Оба числа отгаданы"} за {moves} {plural(moves, MOVES)}
      </Verdict>
      <SecretsGrid caption="Какие числа искали" names={s.names} secrets={s.secrets} mono />
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
