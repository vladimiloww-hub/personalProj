"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ShareIcon } from "../components/icons";
import { Button, GameScreen, Page, RulesButton, Sheet, StatusLine, TopBar, useToast } from "../components/ui";
import {
  LAUNCH_DATE,
  LEVEL_NAMES,
  MAX_MISTAKES,
  addDays,
  dateKey,
  dayNumber,
  emojiRows,
  judge,
  replay,
  type ConnGroup,
  type ConnPuzzle,
} from "../lib/connections";
import { persisted } from "../lib/persist";
import { isRecord, isStrings } from "../lib/sanitize";
import { shareOrCopy } from "../lib/share";

interface DayEntry {
  guesses: string[][];
  /** Set once the puzzle is finished; `onDay` means it was played on its own date. */
  result?: { won: boolean; mistakes: number; onDay: boolean };
}

const store = persisted<Record<string, DayEntry>>("games:connections", {}, (raw) => {
  if (!isRecord(raw)) return null;
  const days: Record<string, DayEntry> = {};
  for (const [date, entry] of Object.entries(raw)) {
    if (!isRecord(entry) || !Array.isArray(entry.guesses) || !entry.guesses.every(isStrings)) continue;
    const r = entry.result;
    days[date] = {
      guesses: entry.guesses,
      ...(isRecord(r) && typeof r.won === "boolean" && typeof r.mistakes === "number"
        ? { result: { won: r.won, mistakes: r.mistakes, onDay: r.onDay === true } }
        : {}),
    };
  }
  return days;
});

// ——— time ———

/** Today's local date, re-read every half minute so midnight brings the new puzzle. */
function useToday(): string | null {
  return useSyncExternalStore(
    (cb) => {
      const timer = setInterval(cb, 30_000);
      return () => clearInterval(timer);
    },
    () => dateKey(new Date()),
    () => null,
  );
}

function Countdown() {
  const seconds = useSyncExternalStore(
    (cb) => {
      const timer = setInterval(cb, 1000);
      return () => clearInterval(timer);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
  if (!seconds) return null;
  const now = new Date(seconds * 1000);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const left = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-wg-display font-extrabold tabular-nums">
      {p(Math.floor(left / 3600))}:{p(Math.floor((left % 3600) / 60))}:{p(left % 60)}
    </span>
  );
}

const formatDate = (key: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(`${key}T12:00:00`));

// ——— loading ———

const puzzles = new Map<string, Promise<ConnPuzzle>>();

function loadPuzzle(date: string): Promise<ConnPuzzle> {
  let pending = puzzles.get(date);
  if (!pending) {
    pending = fetch(`/api/games/connections?date=${date}`).then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Не получилось загрузить");
      return data as ConnPuzzle;
    });
    pending.catch(() => puzzles.delete(date));
    puzzles.set(date, pending);
  }
  return pending;
}

// ——— page ———

export default function ConnectionsGame() {
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const [archive, setArchive] = useState(false);
  const [loaded, setLoaded] = useState<{ date: string; puzzle?: ConnPuzzle; error?: string } | null>(null);
  const date = picked ?? today;

  useEffect(() => {
    if (!date) return;
    let alive = true;
    loadPuzzle(date).then(
      (puzzle) => alive && setLoaded({ date, puzzle }),
      (err: Error) => alive && setLoaded({ date, error: err.message }),
    );
    return () => {
      alive = false;
    };
  }, [date]);

  const current = loaded?.date === date ? loaded : null;

  return (
    <GameScreen>
      <TopBar title="Связи" right={<Rules />} />
      <Page>
        {!current ? (
          <p className="flex items-center justify-center gap-2 py-20 text-[15px] text-wg-muted">
            <span className="wg-turn size-2.5 rounded-full bg-wg-muted" aria-hidden />
            Загружаем головоломку…
          </p>
        ) : current.puzzle ? (
          <Game
            key={current.puzzle.date}
            puzzle={current.puzzle}
            isToday={current.puzzle.date === today}
            today={today ?? current.puzzle.date}
            onArchive={() => setArchive(true)}
          />
        ) : (
          <div className="py-16 text-center">
            <p className="font-wg-display text-xl font-extrabold">{current.error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => setPicked(null)}>
              К сегодняшней
            </Button>
          </div>
        )}
      </Page>
      {today && (
        <Sheet open={archive} onClose={() => setArchive(false)} title="Архив">
          <Archive
            today={today}
            current={date}
            onPick={(d) => {
              setPicked(d === today ? null : d);
              setArchive(false);
            }}
          />
        </Sheet>
      )}
    </GameScreen>
  );
}

function Rules() {
  return (
    <RulesButton title="Связи">
      <p>Найди четыре группы по четыре слова, у которых есть что-то общее.</p>
      <p>Выбери четыре слова и нажми «Проверить». Ошибиться можно {MAX_MISTAKES} раза.</p>
      <p>
        Группы бывают простыми («Ягоды») и коварными («Спряталось число»). Некоторые слова подходят сразу к нескольким
        группам — но правильный ответ один.
      </p>
      <div className="space-y-1.5">
        {LEVEL_NAMES.map((name, level) => (
          <p key={level} className={`wg-l${level} rounded-lg px-3 py-1.5 text-sm font-semibold`}>
            {level === 0 ? "Жёлтая — самая простая" : level === 3 ? "Фиолетовая — самая хитрая" : `${name[0].toUpperCase()}${name.slice(1)}`}
          </p>
        ))}
      </div>
      <p className="text-wg-muted">
        В полночь — новая головоломка. Пропущенные можно сыграть в архиве, а результатом поделиться с другом.
      </p>
    </RulesButton>
  );
}

function GroupBar({ group }: { group: ConnGroup }) {
  return (
    <div className={`wg-l${group.level} wg-conn-bar flex min-h-[64px] flex-col items-center justify-center rounded-xl px-3 py-2 text-center`}>
      <p className="text-[13px] font-extrabold uppercase leading-tight tracking-wide">{group.title}</p>
      <p className="mt-0.5 text-[13px] uppercase leading-snug">{group.words.join(", ")}</p>
    </div>
  );
}

function Game({
  puzzle,
  isToday,
  today,
  onArchive,
}: {
  puzzle: ConnPuzzle;
  isToday: boolean;
  today: string;
  onArchive: () => void;
}) {
  const days = store.use();
  const entry = days[puzzle.date] ?? { guesses: [] };
  const progress = replay(puzzle, entry.guesses);
  const { over, solved } = progress;

  const [arrangement, setArrangement] = useState(puzzle.order);
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState(0);
  const [resultOpen, setResultOpen] = useState(progress.over);
  const [toast, showToast] = useToast();

  const found = new Set(solved.flatMap((g) => g.words));
  const remaining = over ? [] : arrangement.filter((w) => !found.has(w));
  const bars = over ? [...solved, ...puzzle.groups.filter((g) => !solved.includes(g))] : solved;

  const toggle = (word: string) => {
    if (over) return;
    setSelected((s) => (s.includes(word) ? s.filter((w) => w !== word) : s.length < 4 ? [...s, word] : s));
  };

  const shuffle = () =>
    setArrangement((words) => {
      const next = [...words];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });

  const submit = () => {
    if (selected.length !== 4 || over) return;
    const outcome = judge(puzzle, progress.counted, selected);
    if (outcome.kind === "repeat") return showToast("Эту четвёрку уже пробовали");

    const guesses = [...entry.guesses, [...selected]];
    const next = replay(puzzle, guesses);
    store.set((prev) => ({
      ...prev,
      [puzzle.date]: {
        guesses,
        ...(next.over ? { result: { won: next.won, mistakes: next.mistakes, onDay: isToday } } : {}),
      },
    }));

    if (outcome.kind === "correct") setSelected([]);
    else {
      setShake((n) => n + 1);
      if (outcome.kind === "one-away") showToast("Почти! Одно слово лишнее");
    }
    if (next.over) {
      setSelected([]);
      setTimeout(() => setResultOpen(true), 900);
    }
  };

  const left = MAX_MISTAKES - progress.mistakes;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] text-wg-muted">
          <b className="text-wg-text">№ {puzzle.number}</b> · {isToday ? "сегодня" : formatDate(puzzle.date)}
        </p>
        <button type="button" onClick={onArchive} className="text-sm font-semibold text-wg-muted underline-offset-4 hover:underline">
          Архив
        </button>
      </div>
      <p className="-mt-2 text-[15px]">Найди четыре группы по четыре слова</p>

      <div className="grid gap-2">
        {bars.map((group) => (
          <GroupBar key={group.level} group={group} />
        ))}
        {remaining.length > 0 && (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Слова">
            {remaining.map((word) => {
              const on = selected.includes(word);
              return (
                <button
                  key={on ? `${word}-${shake}` : word}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(word)}
                  className={`wg-conn-tile ${on ? "is-on" : ""} ${on && shake ? "wg-conn-shake" : ""}`}
                  style={{ "--len": Math.max(word.length, 5) } as CSSProperties}
                >
                  <span>{word}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!over && (
        <p className="flex items-center justify-center gap-2 text-sm text-wg-muted" aria-label={`Можно ошибиться ещё ${left} раз`}>
          Ошибок в запасе:
          {Array.from({ length: MAX_MISTAKES }, (_, i) => (
            <span key={i} className={`size-3 rounded-full ${i < left ? "bg-wg-text" : "bg-wg-line"}`} aria-hidden />
          ))}
        </p>
      )}

      <StatusLine toast={toast} />

      {over ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setResultOpen(true)}>
            Итоги
          </Button>
          <Button onClick={onArchive}>Архив</Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" className="px-1 text-[13px] sm:text-sm" onClick={shuffle}>
            Перемешать
          </Button>
          <Button
            variant="secondary"
            className="px-1 text-[13px] sm:text-sm"
            onClick={() => setSelected([])}
            disabled={!selected.length}
          >
            Сбросить
          </Button>
          <Button className="px-1 text-[13px] sm:text-sm" onClick={submit} disabled={selected.length !== 4}>
            Проверить
          </Button>
        </div>
      )}

      <Sheet open={over && resultOpen} onClose={() => setResultOpen(false)}>
        <Result puzzle={puzzle} counted={progress.counted} won={progress.won} mistakes={progress.mistakes} today={today} />
      </Sheet>
    </div>
  );
}

const VERDICTS = ["Идеально!", "Блестяще!", "Отлично!", "Уф, получилось!"];

function Result({
  puzzle,
  counted,
  won,
  mistakes,
  today,
}: {
  puzzle: ConnPuzzle;
  counted: string[][];
  won: boolean;
  mistakes: number;
  today: string;
}) {
  const days = store.use();
  const [note, setNote] = useState<string | null>(null);
  const s = stats(days, today);
  const rows = emojiRows(puzzle, counted);

  const share = async () => {
    const outcome = await shareOrCopy({
      title: "Связи",
      text: `Связи №${puzzle.number}\n${rows}`,
      url: `${window.location.origin}/games/connections`,
    });
    setNote(outcome === "copied" ? "Скопировано — отправь другу" : outcome === "failed" ? "Не получилось скопировать" : null);
  };

  return (
    <div className="text-center">
      <p className="font-wg-display text-3xl font-extrabold">{won ? VERDICTS[mistakes] : "В следующий раз!"}</p>
      <p className="mt-1 text-wg-muted">
        Связи №{puzzle.number} · {formatDate(puzzle.date)}
      </p>
      <pre className="mt-4 font-sans text-[22px] leading-[1.15]" aria-label="Твои попытки">
        {rows}
      </pre>
      <Button className="mt-4 w-full" onClick={share}>
        <ShareIcon />
        Поделиться результатом
      </Button>
      {note && (
        <p role="status" className="mt-2 text-sm text-wg-muted">
          {note}
        </p>
      )}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {[
          [s.played, "сыграно"],
          [s.played ? Math.round((s.wins / s.played) * 100) : 0, "% побед"],
          [s.streak, "серия"],
          [s.best, "лучшая серия"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="font-wg-display text-2xl font-extrabold tabular-nums">{value}</p>
            <p className="text-[12px] leading-tight text-wg-muted">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-wg-muted">
        Новая головоломка через <Countdown />
      </p>
    </div>
  );
}

/** Totals over every finished puzzle; streaks count only days won on the day. */
function stats(days: Record<string, DayEntry>, today: string) {
  const finished = Object.entries(days).filter(([, e]) => e.result);
  const onDay = new Set(finished.filter(([, e]) => e.result!.won && e.result!.onDay).map(([d]) => d));
  let streak = 0;
  for (let d = onDay.has(today) ? today : addDays(today, -1); onDay.has(d); d = addDays(d, -1)) streak++;
  let best = 0;
  let run = 0;
  let prev = "";
  for (const d of [...onDay].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { played: finished.length, wins: finished.filter(([, e]) => e.result!.won).length, streak, best };
}

function Archive({ today, current, onPick }: { today: string; current: string | null; onPick: (date: string) => void }) {
  const days = store.use();
  const dates: string[] = [];
  for (let d = today; d >= LAUNCH_DATE; d = addDays(d, -1)) dates.push(d);

  return (
    <ul className="-mx-2 max-h-[60dvh] overflow-y-auto">
      {dates.map((d) => {
        const e = days[d];
        const status = e?.result ? (e.result.won ? "✓" : "✗") : e?.guesses.length ? "…" : "";
        return (
          <li key={d}>
            <button
              type="button"
              onClick={() => onPick(d)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-wg-surface-2 ${
                d === current ? "bg-wg-surface-2" : ""
              }`}
            >
              <span className="w-12 shrink-0 font-wg-display font-extrabold tabular-nums">№{dayNumber(d)}</span>
              <span className="flex-1">{d === today ? "Сегодня" : formatDate(d)}</span>
              <span className="w-5 text-center font-bold text-wg-muted" aria-label={status ? undefined : "не сыграно"}>
                {status}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
