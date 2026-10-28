import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { isRecord, persisted } from "../persist";
import type { Seat } from "../turns";
import { roomTopic, type OnlineGame, type RoomAction, type RoomView } from "./types";

/** Browser side of online rooms: the API calls and the realtime channel. */

const API = "/api/games/rooms";

/** Per-room secret that proves which seat this browser holds. */
const tokens = persisted<Record<string, string>>("games:rooms", {}, (raw) =>
  isRecord(raw)
    ? Object.fromEntries(Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string"))
    : null,
);

function rememberToken(code: string, token: string) {
  tokens.set((prev) => {
    const next = { ...prev, [code]: token };
    const keys = Object.keys(next);
    keys.slice(0, Math.max(0, keys.length - 30)).forEach((k) => delete next[k]);
    return next;
  });
}

export class RoomError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, code: string | null, payload?: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: payload ? "POST" : "GET",
      headers: {
        "content-type": "application/json",
        ...(code && tokens.get()[code] ? { "x-room-token": tokens.get()[code] } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new RoomError("Нет связи с сервером", 0);
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = isRecord(data) && typeof data.error === "string" ? data.error : "Сервер не отвечает";
    throw new RoomError(message, res.status);
  }
  return data as T;
}

/** Makes a room and returns its code; this browser takes the first seat. */
export async function createRoom(game: OnlineGame, settings: object, name: string): Promise<string> {
  const { token, room } = await call<{ token: string; room: RoomView }>("", null, { game, settings, name });
  rememberToken(room.code, token);
  return room.code;
}

export async function fetchRoom(code: string): Promise<RoomView> {
  return (await call<{ room: RoomView }>(`/${code}`, code)).room;
}

export async function joinRoom(code: string, name: string): Promise<RoomView> {
  const { token, room } = await call<{ token: string; room: RoomView }>(`/${code}/join`, code, { name });
  rememberToken(code, token);
  return room;
}

export async function sendAction(code: string, action: RoomAction): Promise<RoomView> {
  return (await call<{ room: RoomView }>(`/${code}/action`, code, { action })).room;
}

// ——— realtime ———

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: Promise<SupabaseClient> | null = null;

function supabase(): Promise<SupabaseClient> | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }),
  );
  return client;
}

export interface RoomEvents {
  /** The server saved a new version of the room. */
  onUpdate: (version: number) => void;
  /** Which seats currently have the room open. */
  onPresence: (online: [boolean, boolean]) => void;
  /** Whether the live channel is connected; without it the page polls. */
  onLive: (live: boolean) => void;
}

/** Listens for room changes; returns the unsubscribe function. Without Supabase it does nothing. */
export function subscribeRoom(code: string, seat: Seat | null, events: RoomEvents): () => void {
  const pending = supabase();
  if (!pending) return () => {};
  let channel: RealtimeChannel | null = null;
  let closed = false;

  pending
    .then((sb) => {
      if (closed) return;
      channel = sb.channel(roomTopic(code), {
        config: { presence: { key: seat === null ? `guest-${Math.random()}` : String(seat), enabled: true } },
      });
      const ch = channel;
      ch.on("broadcast", { event: "update" }, ({ payload }) => {
        events.onUpdate(isRecord(payload) && typeof payload.version === "number" ? payload.version : Infinity);
      })
        .on("presence", { event: "sync" }, () => {
          const state = ch.presenceState();
          events.onPresence(["0" in state, "1" in state]);
        })
        .subscribe((status) => {
          events.onLive(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED" && seat !== null) void ch.track({ seat });
        });
    })
    .catch(() => events.onLive(false));

  return () => {
    closed = true;
    const ch = channel;
    if (ch) void pending.then((sb) => sb.removeChannel(ch));
  };
}
