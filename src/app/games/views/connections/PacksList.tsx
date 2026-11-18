"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameScreen, Page, TopBar } from "../../components/ui";
import { plural } from "../../lib/plural";
import { ConnectionsRules, getJson, packKey, playStore } from "./Board";

interface PackSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  total: number;
  available: number[];
}

/** /games/connections/packs: the packs the admin chose to list. */
export default function PacksList() {
  const [packs, setPacks] = useState<PackSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entries = playStore.use();

  useEffect(() => {
    getJson<{ packs: PackSummary[] }>("/api/games/connections/packs").then(
      (data) => setPacks(data.packs),
      (err: Error) => setError(err.message),
    );
  }, []);

  return (
    <GameScreen>
      <TopBar title="Наборы «Связей»" back="/games/connections" right={<ConnectionsRules />} />
      <Page>
        <div>
          <h2 className="font-wg-display text-2xl font-extrabold">Наборы головоломок</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-wg-muted">
            Тематические паки помимо ежедневной головоломки — играй в любом порядке.
          </p>
        </div>
        {error && <p className="text-center font-semibold">{error}</p>}
        {!packs && !error && <p className="py-10 text-center text-wg-muted">Загружаем…</p>}
        {packs?.length === 0 && <p className="py-10 text-center text-wg-muted">Пока ни одного набора.</p>}
        <div className="grid gap-3">
          {packs?.map((p) => {
            const done = p.available.filter((n) => entries[packKey(p.id, n)]?.result).length;
            return (
              <Link key={p.id} href={`/games/connections/pack/${p.id}`} className="wg-card block p-4 transition hover:border-wg-muted">
                <p className="font-wg-display text-lg font-extrabold">{p.title}</p>
                {p.author && <p className="text-sm text-wg-muted">Автор: {p.author}</p>}
                {p.description && <p className="mt-1.5 text-[14px] leading-relaxed text-wg-muted">{p.description}</p>}
                <p className="mt-2 text-[13px] font-semibold">
                  {p.available.length} {plural(p.available.length, ["головоломка", "головоломки", "головоломок"])}
                  {done > 0 && <span className="text-wg-muted"> · пройдено {done}</span>}
                </p>
              </Link>
            );
          })}
        </div>
        <Link href="/games/connections/admin" className="text-center text-sm text-wg-muted underline-offset-4 hover:underline">
          Добавить свой набор
        </Link>
      </Page>
    </GameScreen>
  );
}
