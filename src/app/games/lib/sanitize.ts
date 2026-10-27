import { isRecord } from "./persist";
import type { Seat } from "./turns";

/** Small guards for reading saved games back from localStorage. */

export const isSeat = (v: unknown): v is Seat => v === 0 || v === 1;

export const isOneOf = <T extends string | number>(v: unknown, options: readonly T[]): v is T =>
  options.includes(v as T);

export function isPair<T>(v: unknown, item: (x: unknown) => x is T): v is [T, T] {
  return Array.isArray(v) && v.length === 2 && item(v[0]) && item(v[1]);
}

export const isString = (v: unknown): v is string => typeof v === "string";
export const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
export const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export { isRecord };
