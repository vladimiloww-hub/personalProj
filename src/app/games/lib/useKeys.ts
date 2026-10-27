import { useEffect, useEffectEvent } from "react";

/**
 * Physical keyboard input. `mapper` turns a keydown into a game key (or null
 * to ignore it); typing into form fields and activating focused buttons is
 * left alone.
 */
export function useKeys(
  handler: (key: string) => void,
  mapper: (e: KeyboardEvent) => string | null,
  enabled = true,
) {
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    if ((e.key === "Enter" || e.key === " ") && target?.closest("button, a")) return;
    if (e.repeat && e.key === "Enter") return;
    const key = mapper(e);
    if (key === null) return;
    e.preventDefault();
    handler(key);
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);
}
