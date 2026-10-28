"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Page } from "../../components/ui";
import type { RoomView } from "../../lib/online/types";
import { other, type Seat } from "../../lib/turns";
import type { RoomHandle } from "./useRoom";

/** Bits used by all three online games. */

export type ViewOf<G extends RoomView["game"]> = Extract<RoomView, { game: G }> & { me: Seat };

export interface GameProps<G extends RoomView["game"]> {
  room: RoomHandle;
  view: ViewOf<G>;
}

export function playerNames(view: RoomView): [string, string] {
  return [view.names[0] ?? "Игрок 1", view.names[1] ?? "Игрок 2"];
}

/** "Боря не в сети" under the score, while the opponent has the room closed. */
export function OpponentAway({ room, view }: { room: RoomHandle; view: ViewOf<RoomView["game"]> }) {
  const opp = other(view.me);
  if (!room.online || room.online[opp]) return null;
  return (
    <p className="shrink-0 pt-1 text-center text-[12px] text-wg-muted">
      <span className="mr-1.5 inline-block size-1.5 rounded-full bg-wg-muted align-middle" aria-hidden />
      {playerNames(view)[opp]} не в сети — ход дождётся
    </p>
  );
}

/** Full-screen "waiting for the other player" message. */
export function Waiting({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Page>
      <div className="flex flex-1 flex-col items-center gap-4 py-10 text-center">
        <span className="wg-turn size-3 rounded-full bg-wg-pc" aria-hidden />
        <h2 className="font-wg-display text-2xl font-extrabold">{title}</h2>
        {children && <div className="text-[15px] leading-relaxed text-wg-muted">{children}</div>}
      </div>
    </Page>
  );
}

export function AllGamesLink() {
  return (
    <Link href="/games" className="mt-1 text-center text-sm font-semibold text-wg-muted underline-offset-4 hover:underline">
      Все игры
    </Link>
  );
}
