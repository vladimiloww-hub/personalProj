"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { BullsGuess, Note } from "../lib/bulls";
import { plural } from "../lib/plural";
import type { Seat } from "../lib/turns";

/** Pieces shared by the games on one phone and online. */

/** One player's word board with their name above it, sized to fit its share of the screen. */
export function BoardPanel({
  seat,
  name,
  badge,
  dim,
  footer,
  withFooter = !!footer,
  children,
}: {
  seat: Seat;
  name: string;
  badge?: ReactNode;
  dim?: boolean;
  footer?: ReactNode;
  /** Keep the footer line even when empty, so side-by-side boards line up. */
  withFooter?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`wg-p${seat} flex min-w-0 flex-1 transition-opacity duration-300 ${dim ? "opacity-50" : ""}`}
      aria-label={`Доска: ${name}`}
    >
      <div className="wg-fit">
        <div className="flex flex-col gap-2" style={{ "--reserve": withFooter ? "56px" : "28px" } as CSSProperties}>
          <div className="flex w-0 min-w-full items-center gap-1.5 text-[13px] leading-5">
            <span className="size-2 shrink-0 rounded-full bg-wg-pc" aria-hidden />
            <b className="min-w-0 truncate">{name}</b>
            {badge && <span className="ml-auto shrink-0 font-bold text-wg-pc">{badge}</span>}
          </div>
          {children}
          {withFooter && (
            <p className="w-0 min-w-full truncate text-center text-[13px] leading-5 text-wg-muted">{footer || "\u00a0"}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** A word spelled in green tiles, for result screens. */
export function WordTiles({ word }: { word: string }) {
  return (
    <div className="mx-auto mt-4 flex max-w-[260px] justify-center gap-1.5" aria-label={`Слово: ${word}`}>
      {Array.from(word).map((ch, i) => (
        <span
          key={i}
          className="grid aspect-square flex-1 place-items-center rounded-md bg-wg-correct font-extrabold uppercase text-white"
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

/** "Победа: name" or "Ничья", with a line under it. */
export function Verdict({ winner, names, children }: { winner: Seat | null; names: [string, string]; children?: ReactNode }) {
  return winner !== null ? (
    <div className={`wg-p${winner}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wg-muted">Победа</p>
      <p className="mt-1 font-wg-display text-3xl font-extrabold text-wg-pc">{names[winner]}</p>
      {children && <p className="mt-2 text-wg-muted">{children}</p>}
    </div>
  ) : (
    <div>
      <p className="font-wg-display text-3xl font-extrabold">Ничья</p>
      {children && <p className="mt-2 text-wg-muted">{children}</p>}
    </div>
  );
}

/** What each player was looking for, revealed at the end. */
export function SecretsGrid({
  caption,
  names,
  secrets,
  mono,
}: {
  caption: string;
  names: [string, string];
  secrets: [string | null, string | null];
  mono?: boolean;
}) {
  return (
    <>
      <p className="mt-5 text-[13px] font-semibold text-wg-muted">{caption}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-left">
        {([0, 1] as const).map((seat) => (
          <div key={seat} className={`wg-p${seat} rounded-xl bg-wg-surface-2 p-3`}>
            <p className="truncate text-[13px] font-semibold text-wg-pc">{names[seat]}</p>
            <p
              className={`mt-0.5 font-extrabold uppercase ${
                mono ? "font-mono text-xl tracking-widest" : "font-wg-display text-lg tracking-wider"
              }`}
            >
              {secrets[seat] ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </>
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

/** One player's bulls-and-cows guesses, scrolled to the latest. */
export function BullsColumn({
  seat,
  name,
  guesses,
  active,
  dim,
  badge,
  footer,
}: {
  seat: Seat;
  name: string;
  guesses: BullsGuess[];
  active?: boolean;
  dim?: boolean;
  badge?: ReactNode;
  footer?: ReactNode;
}) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [guesses.length]);

  return (
    <section
      className={`wg-p${seat} flex min-w-0 flex-1 flex-col gap-2 transition-opacity duration-300 ${dim ? "opacity-55" : ""}`}
      aria-label={`Ходы: ${name}`}
    >
      <div className="flex items-center gap-1.5 px-1 text-[13px]">
        <span className="size-2 shrink-0 rounded-full bg-wg-pc" aria-hidden />
        <b className="min-w-0 truncate">{name}</b>
        {badge && <span className="ml-auto shrink-0 font-bold text-wg-pc">{badge}</span>}
      </div>
      <ol
        ref={list}
        className={`min-h-0 flex-1 overflow-y-auto rounded-xl border bg-wg-surface py-1 ${
          active ? "border-wg-pc" : "border-wg-line"
        }`}
      >
        {guesses.length === 0 && <li className="px-3 py-3 text-center text-[13px] text-wg-muted">Пока без ходов</li>}
        {guesses.map(({ code, bulls, cows }, i) => (
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
        ))}
      </ol>
      {footer && <p className="text-center text-[13px] text-wg-muted">{footer}</p>}
    </section>
  );
}

/** Ten digits a player taps through "no" and "yes" while working out the number. */
export function Notes({ notes, onToggle }: { notes: Note[]; onToggle: (digit: number) => void }) {
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
