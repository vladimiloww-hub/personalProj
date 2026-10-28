import type { Seat } from "./turns";

/** Small guards for data read back from localStorage or sent to the API. */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export const isSeat = (v: unknown): v is Seat => v === 0 || v === 1;

export const isOneOf = <T extends string | number>(v: unknown, options: readonly T[]): v is T =>
  options.includes(v as T);

export function isPair<T>(v: unknown, item: (x: unknown) => x is T): v is [T, T] {
  return Array.isArray(v) && v.length === 2 && item(v[0]) && item(v[1]);
}

export const isString = (v: unknown): v is string => typeof v === "string";
export const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
export const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
