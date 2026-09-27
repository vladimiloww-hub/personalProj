"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

const SWIPE_MIN_X = 60;
const SWIPE_MAX_Y = 50;

/**
 * Easier question switching around a question card:
 * - swipe left/right on touch screens;
 * - tap zones along the screen edges on phones (right = next, left = back);
 * - big round arrows beside the card on wide screens.
 * Taps on buttons, links and inputs inside the card are left alone.
 */
export default function SwipeNav({
  children,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  children: ReactNode;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="relative">
      <div
        onTouchStart={(e) => {
          const t = e.touches[0];
          start.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchEnd={(e) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y) return;
          if (dx < 0 && canNext) onNext();
          else if (dx > 0 && canPrev) onPrev();
        }}
      >
        {children}
      </div>

      {/* Phone: tap strips on the screen edges */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Предыдущий вопрос"
        className="mr-noprint fixed bottom-24 left-0 top-28 z-10 flex w-7 items-center justify-start pl-0.5 text-mr-muted/60 disabled:hidden lg:hidden"
      >
        <Icon name="left" size={16} />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Следующий вопрос"
        className="mr-noprint fixed bottom-24 right-0 top-28 z-10 flex w-7 items-center justify-end pr-0.5 text-mr-muted/60 disabled:hidden lg:hidden"
      >
        <Icon name="right" size={16} />
      </button>

      {/* Desktop: arrows beside the card */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Предыдущий вопрос (←)"
        title="Предыдущий вопрос (←)"
        className="mr-noprint absolute -left-16 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-mr-line bg-mr-surface text-mr-muted shadow-sm transition-colors hover:border-mr-accent hover:text-mr-accent disabled:opacity-0 lg:flex"
      >
        <Icon name="left" size={22} />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Следующий вопрос (→)"
        title="Следующий вопрос (→)"
        className="mr-noprint absolute -right-16 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-mr-line bg-mr-surface text-mr-muted shadow-sm transition-colors hover:border-mr-accent hover:text-mr-accent disabled:opacity-0 lg:flex"
      >
        <Icon name="right" size={22} />
      </button>
    </div>
  );
}
