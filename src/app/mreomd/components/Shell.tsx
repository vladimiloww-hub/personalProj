"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { setSettings, useStore } from "../lib/store";
import { Icon, type IconName } from "./Icon";

const BASE = "/mreomd";

type NavItem = { href: string; label: string; icon: IconName };

const NAV: NavItem[] = [
  { href: BASE, label: "Главная", icon: "home" },
  { href: `${BASE}/practice`, label: "Тренировка", icon: "target" },
  { href: `${BASE}/exam`, label: "Экзамен", icon: "exam" },
  { href: `${BASE}/questions`, label: "Вопросы", icon: "search" },
  { href: `${BASE}/saved`, label: "Сохранённые", icon: "star" },
  { href: `${BASE}/signs`, label: "Знаки", icon: "sign" },
  { href: `${BASE}/stats`, label: "Статистика", icon: "chart" },
  { href: `${BASE}/info`, label: "Справка", icon: "info" },
];

const BOTTOM = [NAV[0], NAV[2], NAV[3], NAV[4]];
const MORE = [NAV[1], NAV[5], NAV[6], NAV[7]];

function isActive(pathname: string, href: string) {
  return href === BASE ? pathname === BASE : pathname.startsWith(href);
}

export default function Shell({
  children,
  fontClass,
}: {
  children: React.ReactNode;
  fontClass: string;
}) {
  const pathname = usePathname() ?? BASE;
  const { settings } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const theme = settings.theme === "system" ? undefined : settings.theme;
  const moreActive = MORE.some((i) => isActive(pathname, i.href));

  return (
    <div
      data-theme={theme}
      className={`mreo-root ${fontClass} flex min-h-dvh flex-1 flex-col antialiased`}
    >
      <header className="mr-noprint sticky top-0 z-30 border-b border-mr-line bg-mr-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href={BASE} className="flex shrink-0 items-center gap-2 font-semibold" aria-label="MREO.md — главная">
            <Logo />
            <span className="text-[15px] tracking-tight">
              MREO<span className="text-mr-muted">.md</span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Разделы">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  isActive(pathname, item.href)
                    ? "bg-mr-accent-soft font-medium text-mr-accent"
                    : "text-mr-muted hover:bg-mr-surface-2 hover:text-mr-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:pb-12">{children}</main>

      <footer className="mr-noprint mx-auto hidden w-full max-w-6xl px-4 pb-8 text-xs text-mr-muted lg:block">
        Неофициальный тренажёр. Формат экзамена и нормы — по данным ASP и РЦР (ПП № 357/2009); проверяйте
        актуальность на asp.gov.md.
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        className="mr-noprint fixed inset-x-0 bottom-0 z-40 border-t border-mr-line bg-mr-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Разделы"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {BOTTOM.map((item) => (
            <BottomLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              moreOpen || moreActive ? "text-mr-accent" : "text-mr-muted"
            }`}
          >
            <Icon name="more" size={22} />
            Ещё
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="mr-card absolute inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] p-2"
          >
            {MORE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] ${
                  isActive(pathname, item.href) ? "bg-mr-accent-soft text-mr-accent" : "hover:bg-mr-surface-2"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BottomLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-mr-accent" : "text-mr-muted"}`}
    >
      <Icon name={item.icon} size={22} filled={active && item.icon === "star"} />
      {item.label === "Сохранённые" ? "Избранное" : item.label}
    </Link>
  );
}

function Logo() {
  return (
    <svg width={28} height={28} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="50,3 97,50 50,97 3,50" fill="#fff" stroke="#1a1a1a" strokeWidth={3} />
      <polygon points="50,17 83,50 50,83 17,50" fill="#f7c600" />
      <text x="50" y="60" textAnchor="middle" fontSize="28" fontWeight="800" fontFamily="Arial" fill="#1a1a1a">
        MD
      </text>
    </svg>
  );
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { settings } = useStore();
  return (
    <div
      className={`flex rounded-lg border border-mr-line bg-mr-surface p-0.5 text-xs font-medium ${className}`}
      role="group"
      aria-label="Язык вопросов"
      title="Язык вопросов: экзамен ASP можно сдавать на русском или румынском"
    >
      {(["ru", "ro"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setSettings({ lang: l })}
          aria-pressed={settings.lang === l}
          className={`rounded-md px-2 py-1 uppercase ${
            settings.lang === l ? "bg-mr-accent text-mr-accent-ink" : "text-mr-muted hover:text-mr-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { settings } = useStore();
  const next = settings.theme === "system" ? "dark" : settings.theme === "dark" ? "light" : "system";
  const label =
    settings.theme === "system" ? "Тема: как в системе" : settings.theme === "dark" ? "Тема: тёмная" : "Тема: светлая";
  return (
    <button
      type="button"
      onClick={() => setSettings({ theme: next })}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-mr-line bg-mr-surface text-mr-muted hover:text-mr-text"
      aria-label={`${label}. Переключить`}
      title={label}
    >
      {settings.theme === "dark" ? (
        <Icon name="moon" size={16} />
      ) : settings.theme === "light" ? (
        <Icon name="sun" size={16} />
      ) : (
        <span className="text-[10px] font-semibold">A</span>
      )}
    </button>
  );
}
