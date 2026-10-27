import { persisted } from "./persist";

export const NAME_MAX = 16;
export const DEFAULT_NAMES: [string, string] = ["Игрок 1", "Игрок 2"];

export function cleanName(name: unknown, fallback: string): string {
  const s = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";
  return s || fallback;
}

/** The last names typed in, so every game starts with them filled in. */
export const playerNames = persisted<[string, string]>("games:players", DEFAULT_NAMES, (raw) =>
  Array.isArray(raw) ? [cleanName(raw[0], DEFAULT_NAMES[0]), cleanName(raw[1], DEFAULT_NAMES[1])] : null,
);
