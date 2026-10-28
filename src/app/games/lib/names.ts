/** Player names, safe to use on the server too. */

export const NAME_MAX = 16;
export const DEFAULT_NAMES: [string, string] = ["Игрок 1", "Игрок 2"];

export function cleanName(name: unknown, fallback: string): string {
  const s = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX) : "";
  return s || fallback;
}
