"use client";

import { useEffect, useState } from "react";
import { Button, GameScreen, Page, Sheet, TopBar } from "../../components/ui";
import type { ConnPuzzle } from "../../lib/connections";
import { Board, ConnectionsRules, getJson, packKey, playStore } from "./Board";

interface PackSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  total: number;
  available: number[];
}

/** /games/connections/pack/[id]: play a custom pack, one puzzle after another. */
export default function PackGame({ id }: { id: string }) {
  const entries = playStore.use();
  const [pack, setPack] = useState<PackSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [list, setList] = useState(false);
  const [loaded, setLoaded] = useState<{ n: number; puzzle?: ConnPuzzle; error?: string } | null>(null);

  useEffect(() => {
    getJson<PackSummary>(`/api/games/connections/packs/${id}`).then(
      (p) => {
        setPack(p);
        // Start at the first puzzle not finished yet (picked once, so finishing it doesn't jump away).
        const done = playStore.get();
        setPicked((cur) => cur ?? p.available.find((k) => !done[packKey(id, k)]?.result) ?? p.available[0] ?? null);
      },
      (err: Error) => setError(err.message),
    );
  }, [id]);

  const n = picked;

  useEffect(() => {
    if (n === null) return;
    let alive = true;
    getJson<ConnPuzzle>(`/api/games/connections/packs/${id}/${n}`).then(
      (puzzle) => alive && setLoaded({ n, puzzle }),
      (err: Error) => alive && setLoaded({ n, error: err.message }),
    );
    return () => {
      alive = false;
    };
  }, [id, n]);

  const current = loaded?.n === n ? loaded : null;
  const nextUnplayed = pack?.available.find((k) => k !== n && !entries[packKey(id, k)]?.result);
  const goNext = () => (nextUnplayed ? setPicked(nextUnplayed) : setList(true));
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/games/connections/pack/${id}`;

  return (
    <GameScreen>
      <TopBar title={pack?.title ?? "Связи"} back="/games/connections/packs" right={<ConnectionsRules />} />
      <Page>
        {error ? (
          <p className="py-16 text-center font-wg-display text-xl font-extrabold">{error}</p>
        ) : !pack || (n !== null && !current) ? (
          <p className="py-20 text-center text-[15px] text-wg-muted">Загружаем…</p>
        ) : n === null ? (
          <p className="py-16 text-center text-wg-muted">В этом наборе пока нечего играть.</p>
        ) : current?.puzzle ? (
          <Board
            key={n}
            puzzle={current.puzzle}
            storageKey={packKey(id, n)}
            header={
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-[15px] text-wg-muted">
                  <b className="text-wg-text">№ {n}</b> из {pack.total}
                  {pack.author && <> · {pack.author}</>}
                </p>
                <button
                  type="button"
                  onClick={() => setList(true)}
                  className="shrink-0 text-sm font-semibold text-wg-muted underline-offset-4 hover:underline"
                >
                  Все головоломки
                </button>
              </div>
            }
            next={nextUnplayed ? { label: "Следующая", onClick: goNext } : { label: "Все головоломки", onClick: () => setList(true) }}
            shareTitle={`Связи · «${pack.title}» №${n}`}
            shareUrl={url}
            subtitle={`«${pack.title}» · №${n}`}
            resultFooter={
              nextUnplayed ? (
                <Button variant="secondary" className="mt-3 w-full" onClick={goNext}>
                  Следующая головоломка
                </Button>
              ) : (
                <p className="mt-4 text-sm text-wg-muted">Это была последняя непройденная головоломка набора.</p>
              )
            }
          />
        ) : (
          <p className="py-16 text-center font-semibold">{current?.error}</p>
        )}
      </Page>
      {pack && (
        <Sheet open={list} onClose={() => setList(false)} title={pack.title}>
          {pack.description && <p className="-mt-1 mb-3 text-sm text-wg-muted">{pack.description}</p>}
          <div className="grid grid-cols-5 gap-2">
            {pack.available.map((k) => {
              const e = entries[packKey(id, k)];
              const status = e?.result ? (e.result.won ? "✓" : "✗") : e?.guesses.length ? "…" : "";
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setPicked(k);
                    setList(false);
                  }}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border transition ${
                    k === n ? "border-wg-text bg-wg-surface-2" : "border-wg-line hover:bg-wg-surface-2"
                  }`}
                >
                  <span className="font-wg-display font-extrabold">{k}</span>
                  <span className="h-4 text-[12px] font-bold text-wg-muted">{status}</span>
                </button>
              );
            })}
          </div>
          {pack.available.length < pack.total && (
            <p className="mt-3 text-[13px] text-wg-muted">
              Ещё {pack.total - pack.available.length} — появятся в ежедневной ленте в свой день.
            </p>
          )}
        </Sheet>
      )}
    </GameScreen>
  );
}
