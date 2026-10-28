"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoomError, createRoom } from "../lib/online/client";
import type { OnlineGame } from "../lib/online/types";
import { DEFAULT_NAMES, NAME_MAX, cleanName, playerNames } from "../lib/players";
import { Segmented } from "./ui";

export type Where = "local" | "online";

/** "One phone or online" switch at the top of a game's setup. */
export function WhereToPlay({ value, onChange }: { value: Where; onChange: (where: Where) => void }) {
  return (
    <Segmented
      label="Где играем"
      value={value}
      options={[
        { value: "local", label: "Один телефон" },
        { value: "online", label: "Онлайн" },
      ]}
      onChange={onChange}
    />
  );
}

/** Online the other player names themselves, so only "your name" is asked. */
export function MyName() {
  const names = playerNames.use();
  return (
    <label className="wg-p0 block">
      <span className="mb-2 block text-[13px] font-semibold text-wg-muted">Твоё имя</span>
      <input
        value={names[0]}
        maxLength={NAME_MAX}
        onChange={(e) => playerNames.set([e.target.value, names[1]])}
        placeholder={DEFAULT_NAMES[0]}
        className="h-12 w-full rounded-xl border border-wg-line bg-wg-surface px-4 text-[15px] font-semibold outline-none transition focus:border-wg-pc"
      />
    </label>
  );
}

/** Creates a room with the chosen settings and opens it. */
export function useOnlineStart(game: OnlineGame) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (settings: object) => {
    const names = playerNames.get();
    const me = cleanName(names[0], DEFAULT_NAMES[0]);
    playerNames.set([me, names[1]]);
    setBusy(true);
    setError(null);
    try {
      router.push(`/games/room/${await createRoom(game, settings, me)}`);
    } catch (err) {
      setError(err instanceof RoomError ? err.message : "Не получилось создать комнату");
      setBusy(false);
    }
  };

  return { start, busy, error };
}

export function OnlineError({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-center text-sm font-semibold">
      {error}
    </p>
  ) : null;
}
