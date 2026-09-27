"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORIES, EXAM_FORMATS, CATEGORY_BY_CODE } from "../data/meta";
import { setSettings, useStore } from "../lib/store";
import type { CategoryCode } from "../lib/types";
import { Icon, type IconName } from "./Icon";

export function CategoryPicker({ compact = false }: { compact?: boolean }) {
  const { settings } = useStore();
  const groups = [
    { format: "short" as const, items: CATEGORIES.filter((c) => c.format === "short") },
    { format: "long" as const, items: CATEGORIES.filter((c) => c.format === "long") },
  ];
  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const f = EXAM_FORMATS[g.format];
        return (
          <div key={g.format} className="flex flex-wrap items-center gap-1.5">
            {!compact && (
              <span className="w-full text-xs text-mr-muted">
                {f.questions} вопросов · {f.minutes} минут
              </span>
            )}
            {g.items.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setSettings({ cat: c.code })}
                aria-pressed={settings.cat === c.code}
                title={c.name.ru}
                className={`min-w-11 rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                  settings.cat === c.code
                    ? "border-mr-accent bg-mr-accent text-mr-accent-ink"
                    : "border-mr-line bg-mr-surface hover:border-mr-accent/60"
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
        );
      })}
      <p className="text-sm text-mr-muted">
        {CATEGORY_BY_CODE[settings.cat as CategoryCode]?.name.ru}
      </p>
    </div>
  );
}

export function Bar({ value, tone = "accent", className = "" }: { value: number; tone?: "accent" | "good" | "bad"; className?: string }) {
  const color = tone === "good" ? "bg-mr-good" : tone === "bad" ? "bg-mr-bad" : "bg-mr-accent";
  // Meter track is a lighter step of the fill's own hue.
  const track = tone === "good" ? "bg-mr-good/15" : tone === "bad" ? "bg-mr-bad/15" : "bg-mr-accent/15";
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${track} ${className}`}>
      <div className={`h-full rounded-full ${color} transition-[width]`} style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: "good" | "bad" | "star";
}) {
  const color = tone === "good" ? "text-mr-good" : tone === "bad" ? "text-mr-bad" : tone === "star" ? "text-mr-star" : "";
  const body = (
    <>
      <div className="text-xs text-mr-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-mr-muted">{hint}</div>}
    </>
  );
  return href ? (
    <Link href={href} className="mr-card block p-4 transition-colors hover:border-mr-accent/60">
      {body}
    </Link>
  ) : (
    <div className="mr-card p-4">{body}</div>
  );
}

export function ModeCard({
  href,
  icon,
  title,
  text,
  count,
  onClick,
}: {
  href: string;
  icon: IconName;
  title: string;
  text: string;
  count?: number;
  onClick?: () => void;
}) {
  const disabled = count === 0;
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-disabled={disabled}
      className={`mr-card group flex items-start gap-3 p-4 transition-colors hover:border-mr-accent/60 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mr-accent-soft text-mr-accent">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-mr-surface-2 px-2 py-0.5 text-xs font-medium text-mr-muted">{count}</span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-mr-muted">{text}</span>
      </span>
      <Icon name="right" className="mt-2 text-mr-muted transition-transform group-hover:translate-x-0.5" size={18} />
    </Link>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-mr-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-mr-accent ${
          checked ? "bg-mr-accent" : "bg-mr-line"
        }`}
      >
        <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-mr-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Empty({ icon = "info", title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mr-card flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-mr-surface-2 text-mr-muted">
        <Icon name={icon} size={24} />
      </span>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-mr-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-mr-accent px-4 py-2.5 text-[15px] font-semibold text-mr-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-mr-line bg-mr-surface px-4 py-2.5 text-[15px] font-medium transition-colors hover:border-mr-accent/60 disabled:opacity-40",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-mr-muted transition-colors hover:bg-mr-surface-2 hover:text-mr-text",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-mr-bad/40 px-4 py-2.5 text-sm font-medium text-mr-bad transition-colors hover:bg-mr-bad-soft",
};
