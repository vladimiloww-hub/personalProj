"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RoomError, fetchRoom, joinRoom, sendAction, subscribeRoom } from "../../lib/online/client";
import type { RoomAction, RoomView } from "../../lib/online/types";

/** How often to re-read the room: rarely with a live channel, often without one. */
const POLL_LIVE_MS = 20_000;
const POLL_MS = 2_500;

export interface RoomHandle {
  view: RoomView | null;
  /** The view before the latest change, so new rows can flip open. */
  prev: RoomView | null;
  /** The last failed request, if the latest one failed. */
  error: RoomError | null;
  /** Which seats have the room open; null until known (needs the live channel). */
  online: [boolean, boolean] | null;
  live: boolean;
  pending: boolean;
  /** Sends a move; resolves to a refusal message, or null when it went through. */
  act: (action: RoomAction) => Promise<string | null>;
  join: (name: string) => Promise<string | null>;
}

export function useRoom(code: string): RoomHandle {
  const [views, setViews] = useState<{ view: RoomView | null; prev: RoomView | null }>({ view: null, prev: null });
  const [error, setError] = useState<RoomError | null>(null);
  const [online, setOnline] = useState<[boolean, boolean] | null>(null);
  const [live, setLive] = useState(false);
  const [pending, setPending] = useState(false);
  const version = useRef(0);
  const me = views.view?.me ?? null;

  useEffect(() => {
    version.current = views.view?.version ?? 0;
  }, [views.view]);

  /** Keeps the newest view; replies can arrive out of order. */
  const accept = useCallback((next: RoomView) => {
    setError(null);
    setViews((cur) =>
      cur.view && (next.version < cur.view.version || (next.version === cur.view.version && next.me === cur.view.me))
        ? cur
        : { view: next, prev: cur.view },
    );
  }, []);

  const refresh = useCallback(
    () =>
      fetchRoom(code).then(accept, (err: unknown) =>
        setError(err instanceof RoomError ? err : new RoomError("Что-то пошло не так", 0)),
      ),
    [code, accept],
  );

  useEffect(() => {
    void refresh();
    return subscribeRoom(code, me, {
      onUpdate: (v) => {
        if (v > version.current) void refresh();
      },
      onPresence: setOnline,
      onLive: setLive,
    });
  }, [code, me, refresh]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(tick, live ? POLL_LIVE_MS : POLL_MS);
    // A phone coming back from the lock screen catches up at once.
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
    };
  }, [live, refresh]);

  const run = useCallback(
    async (request: () => Promise<RoomView>): Promise<string | null> => {
      setPending(true);
      try {
        accept(await request());
        return null;
      } catch (err) {
        void refresh();
        return err instanceof RoomError ? err.message : "Что-то пошло не так";
      } finally {
        setPending(false);
      }
    },
    [accept, refresh],
  );

  const act = useCallback((action: RoomAction) => run(() => sendAction(code, action)), [code, run]);
  const join = useCallback((name: string) => run(() => joinRoom(code, name)), [code, run]);

  return { ...views, error, online, live, pending, act, join };
}

/** Row of `board` that just appeared since the previous view, to flip it open. */
export function newRow(count: number, before: number | undefined): number | undefined {
  return before !== undefined && count > before ? count - 1 : undefined;
}
