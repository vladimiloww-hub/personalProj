"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import { MyName, OnlineError, WhereToPlay, useOnlineStart, type Where } from "../components/OnlineStart";
import SecretEntry from "../components/SecretEntry";
import { BoardPanel, SecretsGrid, Verdict } from "../components/panels";
import { ArrowRightIcon } from "../components/icons";
import {
  Button,
  GameScreen,
  Handoff,
  Legend,
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
import { isSolved, keyStates, makeGuess } from "../lib/evaluate";
import { BACK, ENTER, keyFromEvent } from "../lib/keys";
import { persisted } from "../lib/persist";
import { DEFAULT_NAMES, cleanName, playerNames } from "../lib/players";
import { MOVES, plural } from "../lib/plural";
import { isCount, isOneOf, isPair, isRecord, isSeat, isString, isStrings } from "../lib/sanitize";
import { afterGuess, other, type Seat } from "../lib/turns";
import { useKeys } from "../lib/useKeys";
import { LANGS, MAX_GUESSES, WORD_LENGTH, isLang, loadDict, randomAnswer, type Lang } from "../lib/words";

const PHASES = ["setup", "secret", "handoff", "play", "over"] as const;
const SOURCES = ["custom", "random"] as const;
type Source = (typeof SOURCES)[number];

interface DuelState {
  phase: (typeof PHASES)[number];
  lang: Lang;
  source: Source;
  names: [string, string];
  /** secrets[i] is the word player i is looking for. */
  secrets: [string, string];
  guesses: [string[], string[]];
  starter: Seat;
  turn: Seat;
  /** While secrets are typed in: who types the next one. */
  setter: Seat;
  score: [number, number];
  winner: Seat | null;
}

const FRESH: DuelState = {
  phase: "setup",
  lang: "ru",
  source: "custom",
  names: DEFAULT_NAMES,
  secrets: ["", ""],
  guesses: [[], []],
  starter: 0,
  turn: 0,
  setter: 0,
  score: [0, 0],
  winner: null,
};

const store = persisted<DuelState>("games:duel", FRESH, (raw) => {
  if (
    !isRecord(raw) ||
    !isOneOf(raw.phase, PHASES) ||
    !isLang(raw.lang) ||
    !isOneOf(raw.source, SOURCES) ||
    !isPair(raw.names, isString) ||
    !isPair(raw.secrets, isString) ||
    !isPair(raw.guesses, isStrings) ||
    !isSeat(raw.starter) ||
    !isSeat(raw.turn) ||
    !isSeat(raw.setter) ||
    !isPair(raw.score, isCount) ||
    !(raw.winner === null || isSeat(raw.winner))
  ) {
    return null;
  }
  return raw as unknown as DuelState;
});

/** How long the tiles of a new row take to flip over. */
const REVEAL_MS = 5 * 180 + 500;

function withGuess(s: DuelState, word: string): DuelState {
  const guesses: [string[], string[]] = [[...s.guesses[0]], [...s.guesses[1]]];
  guesses[s.turn].push(word);
  const solved: [boolean, boolean] = [
    guesses[0].at(-1) === s.secrets[0],
    guesses[1].at(-1) === s.secrets[1],
  ];
  const next = afterGuess([guesses[0].length, guesses[1].length], solved, s.starter, MAX_GUESSES);
  if (!next.over) return { ...s, guesses, turn: next.turn };
  const score: [number, number] = [...s.score];
  if (next.winner !== null) score[next.winner]++;
  return { ...s, guesses, score, winner: next.winner, phase: "over" };
}

export default function DuelGame() {
  const s = store.use();
  const hydrated = store.useHydrated();

  useEffect(() => {
    loadDict(s.lang).catch(() => {});
  }, [s.lang]);

  if (!hydrated) return <GameScreen><TopBar title="Вордл-дуэль" /></GameScreen>;

  const rules = (
    <RulesButton title="Вордл-дуэль">
      <p>Каждый игрок ищет своё слово из {WORD_LENGTH} букв на своей доске — его загадывает соперник (или выпадает случайно).</p>
      <p>Ходите по очереди. На каждое слово — {MAX_GUESSES} попыток.</p>
      <Legend />
      <p>
        Побеждает тот, кто найдёт слово за меньшее число попыток. Ходы идут парами: если первый игрок угадал, второй
        ещё успевает ответить — и может сравнять, тогда ничья.
      </p>
      <p className="text-wg-muted">Слова — существительные в начальной форме, Ё пишется как Е.</p>
    </RulesButton>
  );

  return (
    <GameScreen>
      <TopBar title="Вордл-дуэль" right={rules} />
      {s.phase === "setup" && <Setup state={s} />}
      {s.phase === "secret" && (
        <SecretEntry
          key={s.setter}
          kind={{ type: "word", lang: s.lang }}
          seat={s.setter}
          title={`${s.names[s.setter]}, загадай слово`}
          onSubmit={(word) =>
            store.set((prev) => {
              const secrets: [string, string] = [...prev.secrets];
              secrets[other(prev.setter)] = word;
              return secrets[prev.setter]
                ? { ...prev, secrets, phase: "play", turn: prev.starter }
                : { ...prev, secrets, phase: "handoff", setter: other(prev.setter) };
            })
          }
        >
          Его будет угадывать <b className="text-wg-text">{s.names[other(s.setter)]}</b> — пусть пока не подглядывает.
        </SecretEntry>
      )}
      {s.phase === "handoff" && (
        <Handoff seat={s.setter} name={s.names[s.setter]} onReady={() => store.set((prev) => ({ ...prev, phase: "secret" }))}>
          Теперь твоя очередь загадать слово для соперника.
        </Handoff>
      )}
      {(s.phase === "play" || s.phase === "over") && <Play state={s} />}
    </GameScreen>
  );
}

function Setup({ state: s }: { state: DuelState }) {
  const names = playerNames.use();
  const [busy, setBusy] = useState(false);
  const [where, setWhere] = useState<Where>("local");
  const online = useOnlineStart("duel");

  const start = async () => {
    const clean: [string, string] = [cleanName(names[0], DEFAULT_NAMES[0]), cleanName(names[1], DEFAULT_NAMES[1])];
    playerNames.set(clean);
    const base = { ...s, names: clean, guesses: [[], []] as [string[], string[]], winner: null, score: [0, 0] as [number, number] };
    if (s.source === "custom") {
      store.set({ ...base, phase: "secret", secrets: ["", ""], setter: s.starter });
      return;
    }
    setBusy(true);
    try {
      const dict = await loadDict(s.lang);
      const first = randomAnswer(dict);
      store.set({ ...base, phase: "play", secrets: [first, randomAnswer(dict, [first])], turn: s.starter });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div>
        <h2 className="font-wg-display text-2xl font-extrabold">Кто быстрее найдёт слово?</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-wg-muted">
          У каждого своя доска и своё слово. Побеждает тот, кому понадобится меньше попыток — на одном телефоне по
          очереди или онлайн, каждый со своего.
        </p>
      </div>
      <WhereToPlay value={where} onChange={setWhere} />
      {where === "local" ? <NameFields names={names} onChange={playerNames.set} /> : <MyName />}
      <Segmented
        label="Язык слов"
        value={s.lang}
        options={LANGS.map((l) => ({ value: l.id, label: l.label }))}
        onChange={(lang) => store.set((prev) => ({ ...prev, lang }))}
      />
      <Segmented
        label="Слова"
        value={s.source}
        options={[
          { value: "custom", label: "Загадываем сами" },
          { value: "random", label: "Случайные" },
        ]}
        onChange={(source) => store.set((prev) => ({ ...prev, source }))}
      />
      {where === "local" ? (
        <Button onClick={start} disabled={busy}>
          Начать
        </Button>
      ) : (
        <Button onClick={() => online.start({ lang: s.lang, source: s.source })} disabled={online.busy}>
          Создать комнату
        </Button>
      )}
      <OnlineError error={online.error} />
      <Link
        href="/games/challenge"
        className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-wg-line px-4 py-3 text-sm text-wg-muted transition hover:text-wg-text"
      >
        Не одновременно? Отправь вызов по ссылке
        <ArrowRightIcon />
      </Link>
    </Page>
  );
}

function Play({ state: s }: { state: DuelState }) {
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [reveal, setReveal] = useState<{ seat: Seat; row: number } | null>(null);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const over = s.phase === "over";
  // The last row is still flipping over: hold the result back until it's done.
  const finished = over && !reveal;
  const boards = ([0, 1] as const).map((seat) => s.guesses[seat].map((w) => makeGuess(w, s.secrets[seat])));
  // During the flip the board and keyboard still belong to whoever just guessed.
  const focus: Seat = reveal?.seat ?? s.turn;
  const keyboardGuesses = boards[focus].slice(0, reveal ? reveal.row : undefined);
  const resultOpen = finished && !resultClosed;

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (busy.current || reveal || over) return;
    if (current.length < WORD_LENGTH) return reject("Мало букв");
    busy.current = true;
    try {
      const dict = await loadDict(s.lang);
      if (!dict.allowed.has(current) && current !== s.secrets[s.turn]) return reject("Такого слова нет в словаре");
      const seat = s.turn;
      setReveal({ seat, row: s.guesses[seat].length });
      setCurrent("");
      store.set((prev) => withGuess(prev, current));
      timer.current = setTimeout(() => {
        setReveal(null);
        const next = store.get();
        if (next.phase === "play" && next.turn !== seat) showToast(`Ход: ${next.names[next.turn]}`, 1200);
      }, REVEAL_MS);
    } catch {
      reject("Не получилось загрузить словарь");
    } finally {
      busy.current = false;
    }
  };

  const press = (key: string) => {
    if (reveal || over) return;
    if (key === ENTER) return void submit();
    if (key === BACK) setCurrent((c) => c.slice(0, -1));
    else setCurrent((c) => (c.length < WORD_LENGTH ? c + key : c));
  };

  useKeys(press, (e) => keyFromEvent(e, s.lang), !over);

  const rematch = async () => {
    setResultClosed(false);
    const starter = other(s.starter);
    const reset = { ...s, starter, turn: starter, guesses: [[], []] as [string[], string[]], winner: null };
    if (s.source === "custom") {
      store.set({ ...reset, phase: "secret", secrets: ["", ""], setter: starter });
      return;
    }
    const dict = await loadDict(s.lang);
    const first = randomAnswer(dict, s.secrets);
    store.set({ ...reset, phase: "play", secrets: [first, randomAnswer(dict, [...s.secrets, first])] });
  };

  // A starter who already found the word is waiting for the answer move.
  const leader = !over && !reveal ? ([0, 1] as const).find((seat) => isSolved(boards[seat].at(-1))) : undefined;
  const status = over
    ? null
    : leader !== undefined
      ? `${s.names[leader]} — в точку! ${s.names[other(leader)]}, последний шанс на ничью`
      : `Попытка ${Math.min(s.guesses[focus].length + 1, MAX_GUESSES)} из ${MAX_GUESSES}`;

  return (
    <PlayArea>
      <ScoreBar names={s.names} score={s.score} turn={finished ? null : focus} />
      <div className="flex min-h-0 flex-1 gap-3 px-3 pt-3 sm:gap-10 sm:px-6">
        {([0, 1] as const).map((seat) => {
          const active = !finished && seat === focus;
          return (
            <BoardPanel
              key={seat}
              seat={seat}
              name={s.names[seat]}
              dim={!finished && !active}
              badge={active && !over && <span className="wg-turn">ходит</span>}
              footer={
                finished && (
                  <>
                    Слово: <b className="uppercase tracking-wider text-wg-text">{s.secrets[seat]}</b>
                  </>
                )
              }
            >
              <Board
                guesses={boards[seat]}
                active={active && !over}
                current={current}
                revealRow={reveal?.seat === seat ? reveal.row : undefined}
                shake={active ? shake : 0}
                label={`Попытки: ${s.names[seat]}`}
              />
            </BoardPanel>
          );
        })}
      </div>
      <StatusLine toast={toast}>{status}</StatusLine>
      <div className="shrink-0 pb-[max(8px,env(safe-area-inset-bottom))]">
        {finished ? (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
            <Button variant="secondary" onClick={() => setResultClosed(false)}>
              Итоги
            </Button>
            <Button onClick={rematch}>Реванш</Button>
          </div>
        ) : (
          <div className={`wg-p${focus}`}>
            <Keyboard lang={s.lang} states={keyStates(keyboardGuesses)} onKey={press} />
          </div>
        )}
      </div>
      <Sheet open={resultOpen} onClose={() => setResultClosed(true)}>
        <Result state={s} onRematch={rematch} />
      </Sheet>
    </PlayArea>
  );
}

function Result({ state: s, onRematch }: { state: DuelState; onRematch: () => void }) {
  const moves = s.guesses[0].length;
  // A draw means both found their word on the same move, or neither did.
  const bothSolved = s.winner === null && s.guesses[0].at(-1) === s.secrets[0];
  return (
    <div className="text-center">
      <Verdict winner={s.winner} names={s.names}>
        {s.winner !== null || bothSolved
          ? `${bothSolved ? "Оба слова найдены" : "Слово найдено"} за ${moves} ${plural(moves, MOVES)}`
          : "Ни одно слово не найдено"}
      </Verdict>
      <SecretsGrid caption="Какие слова искали" names={s.names} secrets={s.secrets} />
      <p className="mt-4 font-wg-display text-lg font-extrabold tabular-nums">
        {s.score[0]} : {s.score[1]}
      </p>
      <div className="mt-4 grid gap-2">
        <Button onClick={onRematch}>Реванш</Button>
        <Button variant="ghost" onClick={() => store.set((prev) => ({ ...prev, phase: "setup" }))}>
          Новая игра
        </Button>
      </div>
    </div>
  );
}
