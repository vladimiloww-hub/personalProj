"use client";

import { useMemo, useState } from "react";
import { plural } from "../lib/i18n";
import type { ExamRecord } from "../lib/store";

/** Grid laid over the prize picture (3:4, like a phone photo). */
export const PRIZE_COLS = 3;
export const PRIZE_ROWS = 4;
export const PRIZE_CELLS = PRIZE_COLS * PRIZE_ROWS;
/** Only passed exams of the shared A/B pool open cells (older category-B exams are mapped onto it). */
export const PRIZE_CATEGORY = "AB";

const SRC = "/api/mreomd/prize";

/** Fixed pseudo-random order in which cells open, so progress looks the same on every visit. */
const ORDER = (() => {
  const idx = Array.from({ length: PRIZE_CELLS }, (_, i) => i);
  let seed = 20260927;
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
})();

/** Passed category-AB exams, oldest first. */
export function prizeExams(exams: ExamRecord[]) {
  return exams.filter((e) => e.passed && e.cat === PRIZE_CATEGORY).sort((a, b) => a.at - b.at);
}

/** Which cell (1-based count) this exam opened, or null when it opened none. */
export function cellOpenedBy(exams: ExamRecord[], rec: ExamRecord) {
  const n = prizeExams(exams).findIndex((e) => e.id === rec.id);
  return n >= 0 && n < PRIZE_CELLS ? n + 1 : null;
}

export default function PrizeBoard({ exams, highlight }: { exams: ExamRecord[]; highlight?: number | null }) {
  const opened = Math.min(prizeExams(exams).length, PRIZE_CELLS);
  const openSet = useMemo(() => new Set(ORDER.slice(0, opened)), [opened]);
  const newCell = highlight ? ORDER[highlight - 1] : null;
  const [failed, setFailed] = useState(false);
  const left = PRIZE_CELLS - opened;

  return (
    <section className="mr-card overflow-hidden" aria-label="Приз">
      <div className="flex items-center justify-between gap-3 border-b border-mr-line px-4 py-3">
        <div>
          <h2 className="font-semibold">🎁 Твой приз</h2>
          <p className="text-xs text-mr-muted">
            Каждый сданный экзамен категории AB открывает одну ячейку
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {opened} / {PRIZE_CELLS}
        </span>
      </div>
      <div className="p-3">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl bg-mr-surface-2">
          {opened > 0 && !failed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={SRC}
              alt="Приз"
              draggable={false}
              onError={() => setFailed(true)}
              onContextMenu={(e) => e.preventDefault()}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          )}
          <div
            className="absolute inset-0 grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${PRIZE_COLS}, 1fr)`, gridTemplateRows: `repeat(${PRIZE_ROWS}, 1fr)` }}
          >
            {Array.from({ length: PRIZE_CELLS }, (_, i) => {
              const isNew = i === newCell;
              const open = openSet.has(i) && !isNew;
              return (
                <div
                  key={i}
                  className={`mr-prize-cell flex items-center justify-center rounded-md bg-gradient-to-br from-[#f7c600] to-[#e0a100] text-2xl text-[#1a1a1a] ${
                    open ? "opacity-0" : ""
                  } ${isNew ? "is-new" : ""}`}
                  aria-hidden="true"
                >
                  🔒
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-mr-muted">
          {left === 0
            ? "Все ячейки открыты! 🎉"
            : `Осталось ${left} ${plural(left, "ячейка", "ячейки", "ячеек")}: сдай экзамен B, чтобы открыть следующую`}
        </p>
        {failed && <p className="mt-1 text-center text-xs text-mr-bad">Картинка не загрузилась</p>}
      </div>
    </section>
  );
}
