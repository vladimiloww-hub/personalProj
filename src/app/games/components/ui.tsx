"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { NAME_MAX } from "../lib/players";
import type { Seat } from "../lib/turns";
import { ArrowLeftIcon, CloseIcon, HelpIcon } from "./icons";

// ——— layout ———

export function TopBar({ title, back = "/games", right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-wg-line px-2 sm:px-4">
      <Link
        href={back}
        className="grid size-10 place-items-center rounded-full text-wg-muted transition hover:bg-wg-surface-2 hover:text-wg-text"
        aria-label="Назад"
      >
        <ArrowLeftIcon />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-center font-wg-display text-[15px] font-extrabold uppercase tracking-wide">
        {title}
      </h1>
      <div className="flex w-10 justify-end">{right}</div>
    </header>
  );
}

/** Scrollable centred column for setup and info screens. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}

/** Full-height play area: never scrolls, so the keyboard stays in view. */
export function PlayArea({ children }: { children: ReactNode }) {
  return <main className="relative flex min-h-0 w-full flex-1 flex-col">{children}</main>;
}

export function GameScreen({ children }: { children: ReactNode }) {
  return <div className="flex h-dvh flex-col overflow-hidden">{children}</div>;
}

// ——— controls ———

type ButtonVariant = "primary" | "secondary" | "ghost" | "player";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-wg-text text-wg-bg",
  secondary: "border border-wg-line bg-wg-surface text-wg-text hover:bg-wg-surface-2",
  ghost: "text-wg-muted hover:text-wg-text",
  player: "bg-wg-pc text-white",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-wg-muted">{label}</p>
      <div className="flex gap-1 rounded-xl bg-wg-surface-2 p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={`h-10 min-w-0 flex-1 truncate rounded-lg px-2 text-sm font-semibold transition ${
              o.value === value ? "bg-wg-surface text-wg-text shadow-sm" : "text-wg-muted hover:text-wg-text"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NameFields({
  names,
  onChange,
}: {
  names: [string, string];
  onChange: (names: [string, string]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-wg-muted">Игроки</p>
      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as const).map((seat) => (
          <label key={seat} className={`wg-p${seat} relative block`}>
            <span className="absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-wg-pc" aria-hidden />
            <input
              value={names[seat]}
              maxLength={NAME_MAX}
              onChange={(e) => {
                const next: [string, string] = [...names];
                next[seat] = e.target.value;
                onChange(next);
              }}
              placeholder={`Игрок ${seat + 1}`}
              aria-label={`Имя игрока ${seat + 1}`}
              className="h-12 w-full rounded-xl border border-wg-line bg-wg-surface pl-8 pr-3 text-[15px] font-semibold outline-none transition focus:border-wg-pc"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

// ——— overlays ———

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        className="wg-sheet wg-card relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-b-none px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 sm:rounded-b-[18px]"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-wg-muted hover:bg-wg-surface-2"
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        )}
        {title && <h2 className="mb-3 pr-8 font-wg-display text-lg font-extrabold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/** "?" button in the top bar that opens the rules. */
export function RulesButton({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full text-wg-muted transition hover:bg-wg-surface-2 hover:text-wg-text"
        aria-label="Правила"
      >
        <HelpIcon />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-3 text-[15px] leading-relaxed text-wg-text [&_b]:font-semibold">{children}</div>
        <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
          Понятно
        </Button>
      </Sheet>
    </>
  );
}

/** Short-lived message (rejected word, whose turn) shown in the status line. */
export function useToast(): [ReactNode, (text: string, ms?: number) => void] {
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((text: string, ms = 1600) => {
    clearTimeout(timer.current);
    setToast({ text, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = toast && (
    <span key={toast.id} className="wg-toast inline-block rounded-lg bg-wg-text px-3 py-1 font-semibold text-wg-bg">
      {toast.text}
    </span>
  );
  return [node, show];
}

/** One line above the keyboard: game status, replaced by a toast while one is up. */
export function StatusLine({ toast, children }: { toast?: ReactNode; children?: ReactNode }) {
  return (
    <p
      className="flex h-9 shrink-0 items-center justify-center px-4 text-center text-[13px] font-medium text-wg-muted"
      aria-live="polite"
    >
      {toast || children}
    </p>
  );
}

// ——— players ———

export function ScoreBar({
  names,
  score,
  turn,
}: {
  names: [string, string];
  score: [number, number];
  /** Whose move it is, or null between rounds. */
  turn: Seat | null;
}) {
  const side = (seat: Seat) => (
    <div
      className={`wg-p${seat} flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 transition ${
        seat === 1 ? "flex-row-reverse text-right" : ""
      } ${turn === seat ? "bg-wg-pc text-white shadow-sm" : "text-wg-text"}`}
      aria-current={turn === seat ? "true" : undefined}
    >
      <span className={`size-2.5 shrink-0 rounded-full ${turn === seat ? "bg-white" : "bg-wg-pc"}`} aria-hidden />
      <span className="min-w-0 truncate text-sm font-bold">{names[seat]}</span>
    </div>
  );
  return (
    <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center gap-2 px-2 pt-2 sm:px-4">
      {side(0)}
      <div className="shrink-0 px-1 font-wg-display text-lg font-extrabold tabular-nums" aria-label="Счёт">
        {score[0]}
        <span className="mx-1 text-wg-muted">:</span>
        {score[1]}
      </div>
      {side(1)}
    </div>
  );
}

/** "Pass the phone" screen, so the next player doesn't see a secret being typed. */
export function Handoff({
  seat,
  name,
  children,
  onReady,
}: {
  seat: Seat;
  name: string;
  children?: ReactNode;
  onReady: () => void;
}) {
  return (
    <main
      className={`wg-p${seat} mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-10 text-center`}
    >
      <div className="grid size-20 place-items-center rounded-full bg-wg-pc font-wg-display text-3xl font-extrabold text-white shadow-lg">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wg-muted">Передай устройство</p>
        <p className="mt-1 font-wg-display text-3xl font-extrabold text-wg-pc">{name}</p>
      </div>
      {children && <div className="text-[15px] leading-relaxed text-wg-muted">{children}</div>}
      <Button variant="player" className="w-full max-w-xs" onClick={onReady}>
        Это я, {name}
      </Button>
    </main>
  );
}

/** Colour key for the word games' rules. */
export function Legend() {
  const item = (cls: string, text: string) => (
    <li className="flex items-center gap-3">
      <span className={`grid size-8 shrink-0 place-items-center rounded-md font-extrabold uppercase text-white ${cls}`}>
        {text.slice(0, 1)}
      </span>
      <span>{text}</span>
    </li>
  );
  return (
    <ul className="space-y-2">
      {item("bg-wg-correct", "Зелёная — буква на своём месте")}
      {item("bg-wg-present", "Жёлтая — буква есть, но в другом месте")}
      {item("bg-wg-absent", "Серая — такой буквы в слове нет")}
    </ul>
  );
}
