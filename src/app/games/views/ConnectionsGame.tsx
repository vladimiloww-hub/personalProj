"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, GameScreen, Page, Sheet, TopBar } from "../components/ui";
import { LAUNCH_DATE, addDays, dateKey, dayNumber, isDateKey, type ConnPuzzle } from "../lib/connections";
import { Board, ConnectionsRules, Countdown, formatDate, getJson, playStore, type PlayEntry } from "./connections/Board";

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

const puzzles = new Map<string, Promise<ConnPuzzle>>();

function loadPuzzle(date: string): Promise<ConnPuzzle> {
  let pending = puzzles.get(date);
  if (!pending) {
    pending = getJson<ConnPuzzle>(`/api/games/connections?date=${date}`);
    pending.catch(() => puzzles.delete(date));
    puzzles.set(date, pending);
  }
  return pending;
}

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
  const puzzle = current?.puzzle;

  return (
    <GameScreen>
      <TopBar title="Связи" right={<ConnectionsRules />} />
      <Page>
        {!current ? (
          <p className="flex items-center justify-center gap-2 py-20 text-[15px] text-wg-muted">
            <span className="wg-turn size-2.5 rounded-full bg-wg-muted" aria-hidden />
            Загружаем головоломку…
          </p>
        ) : puzzle ? (
          <Board
            key={puzzle.date}
            puzzle={puzzle}
            storageKey={puzzle.date}
            onDay={puzzle.date === today}
            header={
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] text-wg-muted">
                  <b className="text-wg-text">№ {puzzle.number}</b> · {puzzle.date === today ? "сегодня" : formatDate(puzzle.date)}
                </p>
                <button
                  type="button"
                  onClick={() => setArchive(true)}
                  className="text-sm font-semibold text-wg-muted underline-offset-4 hover:underline"
                >
                  Архив
                </button>
              </div>
            }
            next={{ label: "Архив", onClick: () => setArchive(true) }}
            shareTitle={`Связи №${puzzle.number}`}
            shareUrl={`${typeof window === "undefined" ? "" : window.location.origin}/games/connections`}
            subtitle={`Связи №${puzzle.number} · ${formatDate(puzzle.date)}`}
            resultFooter={<DailyStats today={today ?? puzzle.date} />}
          />
        ) : (
          <div className="py-16 text-center">
            <p className="font-wg-display text-xl font-extrabold">{current.error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => setPicked(null)}>
              К сегодняшней
            </Button>
          </div>
        )}
        <Link
          href="/games/connections/packs"
          className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-wg-line px-4 py-3 text-sm text-wg-muted transition hover:text-wg-text"
        >
          Наборы головоломок от игроков
          <span aria-hidden>→</span>
        </Link>
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

function DailyStats({ today }: { today: string }) {
  const s = stats(playStore.use(), today);
  return (
    <>
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
    </>
  );
}

/** Totals over finished daily puzzles; streaks count only days won on the day. */
function stats(entries: Record<string, PlayEntry>, today: string) {
  const finished = Object.entries(entries).filter(([key, e]) => isDateKey(key) && e.result);
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
  const entries = playStore.use();
  const dates: string[] = [];
  for (let d = today; d >= LAUNCH_DATE; d = addDays(d, -1)) dates.push(d);

  return (
    <ul className="-mx-2 max-h-[60dvh] overflow-y-auto">
      {dates.map((d) => {
        const e = entries[d];
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
              <span className="w-5 text-center font-bold text-wg-muted">{status}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
