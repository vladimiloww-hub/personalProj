"use client";

import { useEffect, useRef, useState } from "react";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import {
  Button,
  GameScreen,
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
import { isCount, isOneOf, isPair, isRecord, isSeat, isString, isStrings } from "../lib/sanitize";
import { other, type Seat } from "../lib/turns";
import { useKeys } from "../lib/useKeys";
import { LANGS, MAX_GUESSES, WORD_LENGTH, isLang, loadDict, randomAnswer, type Lang } from "../lib/words";

const PHASES = ["setup", "play", "round", "over"] as const;
const ROUNDS = [3, 5, 7] as const;

interface LingoState {
  phase: (typeof PHASES)[number];
  lang: Lang;
  names: [string, string];
  rounds: (typeof ROUNDS)[number];
  /** Lingo rule: the first letter is given and every guess starts with it. */
  firstLetter: boolean;
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

const FRESH: LingoState = {
  phase: "setup",
  lang: "ru",
  names: DEFAULT_NAMES,
  rounds: 5,
  firstLetter: true,
  round: 1,
  answer: "",
  guesses: [],
  starter: 0,
  turn: 0,
  score: [0, 0],
  roundWinner: null,
  used: [],
};

const store = persisted<LingoState>("games:lingo", FRESH, (raw) => {
  if (
    !isRecord(raw) ||
    !isOneOf(raw.phase, PHASES) ||
    !isLang(raw.lang) ||
    !isPair(raw.names, isString) ||
    !isOneOf(raw.rounds, ROUNDS) ||
    typeof raw.firstLetter !== "boolean" ||
    !isCount(raw.round) ||
    !isString(raw.answer) ||
    !Array.isArray(raw.guesses) ||
    !raw.guesses.every((g) => isRecord(g) && isString(g.word) && isSeat(g.by)) ||
    !isSeat(raw.starter) ||
    !isSeat(raw.turn) ||
    !isPair(raw.score, isCount) ||
    !(raw.roundWinner === null || isSeat(raw.roundWinner)) ||
    !isStrings(raw.used)
  ) {
    return null;
  }
  return raw as unknown as LingoState;
});

const REVEAL_MS = 5 * 180 + 500;

function withGuess(s: LingoState, word: string): LingoState {
  const guesses = [...s.guesses, { word, by: s.turn }];
  const solved = word === s.answer;
  if (!solved && guesses.length < MAX_GUESSES) return { ...s, guesses, turn: other(s.turn) };
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

export default function LingoGame() {
  const s = store.use();
  const hydrated = store.useHydrated();

  useEffect(() => {
    loadDict(s.lang).catch(() => {});
  }, [s.lang]);

  const rules = (
    <RulesButton title="Общая доска">
      <p>Одно слово из {WORD_LENGTH} букв на двоих: общая доска, общая клавиатура, ходите по очереди.</p>
      <p>
        Каждая попытка подсказывает и тебе, и сопернику. Кто первым назовёт слово — получает очко. Если за{" "}
        {MAX_GUESSES} попыток слово не найдено, очко не получает никто.
      </p>
      <Legend />
      <p>
        <b>Первая буква открыта</b> — как в телеигре «Линго»: первая буква уже стоит в строке, а найденные зелёные буквы
        подсвечиваются в новой строке.
      </p>
      <p className="text-wg-muted">Первый ход в раундах переходит по очереди. Цветная точка слева — кто ходил.</p>
    </RulesButton>
  );

  if (!hydrated) return <GameScreen><TopBar title="Общая доска" /></GameScreen>;

  return (
    <GameScreen>
      <TopBar title="Общая доска" right={rules} />
      {s.phase === "setup" ? <Setup state={s} /> : <Play state={s} />}
    </GameScreen>
  );
}

async function newRound(s: LingoState, round: number, starter: Seat): Promise<LingoState> {
  const dict = await loadDict(s.lang);
  const answer = randomAnswer(dict, s.used);
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

function Setup({ state: s }: { state: LingoState }) {
  const names = playerNames.use();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    const clean: [string, string] = [cleanName(names[0], DEFAULT_NAMES[0]), cleanName(names[1], DEFAULT_NAMES[1])];
    playerNames.set(clean);
    setBusy(true);
    try {
      store.set(await newRound({ ...s, names: clean, score: [0, 0] }, 1, 0));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <div>
        <h2 className="font-wg-display text-2xl font-extrabold">Одно слово на двоих</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-wg-muted">
          Ходите по очереди на общей доске. Подсказки достаются обоим — кто первым догадается, забирает раунд.
        </p>
      </div>
      <NameFields names={names} onChange={playerNames.set} />
      <Segmented
        label="Язык слов"
        value={s.lang}
        options={LANGS.map((l) => ({ value: l.id, label: l.label }))}
        onChange={(lang) => store.set((prev) => ({ ...prev, lang, used: [] }))}
      />
      <Segmented
        label="Раундов"
        value={s.rounds}
        options={ROUNDS.map((n) => ({ value: n, label: String(n) }))}
        onChange={(rounds) => store.set((prev) => ({ ...prev, rounds }))}
      />
      <Segmented
        label="Первая буква"
        value={s.firstLetter ? "open" : "hidden"}
        options={[
          { value: "open", label: "Открыта" },
          { value: "hidden", label: "Скрыта" },
        ]}
        onChange={(v) => store.set((prev) => ({ ...prev, firstLetter: v === "open" }))}
      />
      <Button onClick={start} disabled={busy}>
        Начать
      </Button>
    </Page>
  );
}

function Play({ state: s }: { state: LingoState }) {
  const [typed, setTyped] = useState("");
  const [shake, setShake] = useState(0);
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const playing = s.phase === "play";
  const finished = !playing && revealRow === null;
  const guesses = s.guesses.map((g) => makeGuess(g.word, s.answer));
  const prefix = s.firstLetter ? s.answer.slice(0, 1) : "";
  const current = prefix + typed;
  const hints = Array.from(s.answer, (ch, i) =>
    (i === 0 && prefix) || guesses.some((g) => g.marks[i] === "correct") ? ch : undefined,
  );
  // While the last row flips, the turn marker stays with whoever played it.
  const focus: Seat = revealRow !== null ? s.guesses[revealRow].by : s.turn;

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (busy.current || revealRow !== null || !playing) return;
    if (current.length < WORD_LENGTH) return reject("Мало букв");
    busy.current = true;
    try {
      const dict = await loadDict(s.lang);
      if (!dict.allowed.has(current) && current !== s.answer) return reject("Такого слова нет в словаре");
      const seat = s.turn;
      setRevealRow(s.guesses.length);
      setTyped("");
      store.set((prev) => withGuess(prev, current));
      timer.current = setTimeout(() => {
        setRevealRow(null);
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
    if (revealRow !== null || !playing) return;
    if (key === ENTER) return void submit();
    if (key === BACK) setTyped((t) => t.slice(0, -1));
    else setTyped((t) => (prefix.length + t.length < WORD_LENGTH ? t + key : t));
  };

  useKeys(press, (e) => keyFromEvent(e, s.lang), playing);

  const next = async () => {
    setResultClosed(false);
    if (s.phase === "over") {
      store.set(await newRound({ ...s, score: [0, 0], used: s.used }, 1, other(s.starter)));
    } else {
      store.set(await newRound(s, s.round + 1, other(s.starter)));
    }
  };

  const solvedRow = guesses.findIndex(isSolved);

  return (
    <PlayArea>
      <ScoreBar names={s.names} score={s.score} turn={finished ? null : focus} />
      <p className="shrink-0 pt-2 text-center text-[13px] font-semibold text-wg-muted">
        Раунд {s.round} из {s.rounds}
      </p>
      <div className="flex min-h-0 flex-1 px-6 pt-2">
        <div className="wg-fit">
          <Board
            guesses={guesses}
            active={playing}
            current={current}
            hints={hints}
            revealRow={revealRow ?? undefined}
            shake={shake}
            rowSeats={s.guesses.map((g) => g.by)}
            maxWidth={360}
            label="Общая доска"
          />
        </div>
      </div>
      <StatusLine toast={toast}>
        {finished
          ? solvedRow >= 0
            ? `Слово «${s.answer.toUpperCase()}» — очко: ${s.names[s.guesses[solvedRow].by]}`
            : `Никто не угадал: «${s.answer.toUpperCase()}»`
          : `Попытка ${Math.min(s.guesses.length + (revealRow === null ? 1 : 0), MAX_GUESSES)} из ${MAX_GUESSES}`}
      </StatusLine>
      <div className="shrink-0 pb-[max(8px,env(safe-area-inset-bottom))]">
        {finished ? (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
            <Button variant="secondary" onClick={() => setResultClosed(false)}>
              Итоги
            </Button>
            <Button onClick={next}>{s.phase === "over" ? "Ещё матч" : "Дальше"}</Button>
          </div>
        ) : (
          <div className={`wg-p${focus}`}>
            <Keyboard
              lang={s.lang}
              states={keyStates(revealRow !== null ? guesses.slice(0, revealRow) : guesses)}
              onKey={press}
            />
          </div>
        )}
      </div>
      <Sheet open={finished && !resultClosed} onClose={() => setResultClosed(true)}>
        <RoundResult state={s} onNext={next} />
      </Sheet>
    </PlayArea>
  );
}

function RoundResult({ state: s, onNext }: { state: LingoState; onNext: () => void }) {
  const over = s.phase === "over";
  const matchWinner: Seat | null = s.score[0] === s.score[1] ? null : s.score[0] > s.score[1] ? 0 : 1;

  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wg-muted">
        {over ? "Матч окончен" : `Раунд ${s.round} из ${s.rounds}`}
      </p>
      {over ? (
        matchWinner !== null ? (
          <p className={`wg-p${matchWinner} mt-1 font-wg-display text-3xl font-extrabold text-wg-pc`}>
            Победа: {s.names[matchWinner]}
          </p>
        ) : (
          <p className="mt-1 font-wg-display text-3xl font-extrabold">Ничья</p>
        )
      ) : s.roundWinner !== null ? (
        <p className={`wg-p${s.roundWinner} mt-1 font-wg-display text-2xl font-extrabold text-wg-pc`}>
          Очко: {s.names[s.roundWinner]}
        </p>
      ) : (
        <p className="mt-1 font-wg-display text-2xl font-extrabold">Никто не угадал</p>
      )}
      <div className="mx-auto mt-4 flex max-w-[260px] justify-center gap-1.5" aria-label={`Слово: ${s.answer}`}>
        {Array.from(s.answer).map((ch, i) => (
          <span
            key={i}
            className="grid aspect-square flex-1 place-items-center rounded-md bg-wg-correct font-extrabold uppercase text-white"
          >
            {ch}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-4">
        {([0, 1] as const).map((seat) => (
          <div key={seat} className={`wg-p${seat} min-w-0 flex-1 rounded-xl bg-wg-surface-2 p-3`}>
            <p className="truncate text-[13px] font-semibold text-wg-pc">{s.names[seat]}</p>
            <p className="font-wg-display text-2xl font-extrabold tabular-nums">{s.score[seat]}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        <Button onClick={onNext}>{over ? "Ещё матч" : `Раунд ${s.round + 1}`}</Button>
        <Button variant="ghost" onClick={() => store.set((prev) => ({ ...prev, phase: "setup" }))}>
          {over ? "В меню" : "Закончить матч"}
        </Button>
      </div>
    </div>
  );
}
