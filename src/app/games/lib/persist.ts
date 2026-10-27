import { useSyncExternalStore } from "react";

/**
 * A value kept in the viewer's localStorage and shared through
 * useSyncExternalStore, so a game survives a reload or the phone
 * dropping the tab while it is being passed around.
 */
export interface Persisted<T> {
  use(): T;
  /** False during the server render and hydration, true once storage was read. */
  useHydrated(): boolean;
  get(): T;
  set(next: T | ((prev: T) => T)): void;
}

export function persisted<T>(key: string, fallback: T, sanitize: (raw: unknown) => T | null): Persisted<T> {
  let value = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (sanitize(JSON.parse(raw)) ?? fallback) : fallback;
    } catch {
      return fallback;
    }
  };

  const ensureLoaded = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    value = read();
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      value = read();
      listeners.forEach((l) => l());
    });
  };

  const subscribe = (listener: () => void) => {
    ensureLoaded();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const get = () => {
    ensureLoaded();
    return value;
  };

  return {
    use: () => useSyncExternalStore(subscribe, get, () => fallback),
    useHydrated: () =>
      useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
      ),
    get,
    set(next) {
      ensureLoaded();
      value = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage full or blocked (private mode): the game just won't survive a reload.
      }
      listeners.forEach((l) => l());
    },
  };
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
