"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CODE_LENGTH, isRoomCode, normalizeCode } from "../lib/online/types";
import { Button } from "./ui";

/** "Got a room code?" box on the games hub. */
export default function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const valid = isRoomCode(code);

  return (
    <form
      className="wg-card flex items-center gap-2 p-2 pl-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(`/games/room/${code}`);
      }}
    >
      <label className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-wg-muted">Есть код комнаты?</span>
        <input
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder="K7XQ2"
          maxLength={CODE_LENGTH}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label="Код комнаты"
          className="w-full bg-transparent font-wg-display text-xl font-extrabold uppercase tracking-[0.25em] outline-none placeholder:text-wg-line"
        />
      </label>
      <Button type="submit" disabled={!valid} className="shrink-0">
        Войти
      </Button>
    </form>
  );
}
