"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SIGNS, SIGN_GROUPS, type SignDef, type SignGroup } from "../data/signs";
import { QUESTIONS } from "../lib/bank";
import { tr } from "../lib/i18n";
import { normalize } from "../lib/search";
import { useStore } from "../lib/store";
import { Icon } from "../components/Icon";
import { RoadSign } from "../components/Illustration";
import { Empty, PageTitle, Toggle, btn } from "../components/ui";

function questionsWithSign(id: string) {
  return QUESTIONS.filter(
    (q) => q.img && ((q.img.kind === "sign" && q.img.id === id) || (q.img.kind === "signs" && q.img.ids.includes(id))),
  ).length;
}

export default function Signs() {
  const { settings } = useStore();
  const lang = settings.lang;
  const [group, setGroup] = useState<SignGroup | "all">("all");
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<SignDef | null>(null);

  const shown = useMemo(() => {
    const t = normalize(query);
    return SIGNS.filter(
      (s) =>
        (group === "all" || s.group === group) &&
        (!t || normalize(`${s.name.ru} ${s.name.ro} ${s.desc.ru} ${s.desc.ro}`).includes(t)),
    );
  }, [group, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const groupInfo = SIGN_GROUPS.find((g) => g.id === group);

  return (
    <div>
      <PageTitle
        title="Дорожные знаки"
        subtitle="Основные знаки из приложения 1 к РЦР: форма и цвет подсказывают группу. В режиме карточек названия скрыты — проверьте себя."
      />
      <div className="mr-card mb-4 space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mr-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск знака: стоянка, obligatoriu, главная…"
              className="w-full rounded-xl border border-mr-line bg-mr-bg py-2 pl-10 pr-3 text-[15px]"
              aria-label="Поиск знака"
            />
          </div>
          <Toggle
            checked={cards}
            onChange={(v) => {
              setCards(v);
              setRevealed(new Set());
            }}
            label="Карточки"
          />
        </div>
        <div className="mr-scroll-x -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {[{ id: "all" as const, name: { ru: "Все", ro: "Toate" } }, ...SIGN_GROUPS].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              aria-pressed={group === g.id}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                group === g.id ? "border-mr-accent bg-mr-accent-soft font-medium text-mr-accent" : "border-mr-line text-mr-muted hover:text-mr-text"
              }`}
            >
              {tr(g.name, lang)}
            </button>
          ))}
        </div>
        {groupInfo && <p className="text-sm text-mr-muted">{tr(groupInfo.hint, lang)}</p>}
      </div>

      {shown.length === 0 ? (
        <Empty icon="sign" title="Знаки не найдены" text="Попробуйте другое слово." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((s) => {
            const hidden = cards && !revealed.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (hidden) setRevealed((prev) => new Set(prev).add(s.id));
                  else setOpen(s);
                }}
                className="mr-card flex flex-col items-center gap-3 p-4 text-center transition-colors hover:border-mr-accent/60"
              >
                <RoadSign id={s.id} size={88} />
                {hidden ? (
                  <span className="rounded-lg bg-mr-surface-2 px-3 py-1.5 text-sm text-mr-muted">Нажмите, чтобы увидеть</span>
                ) : (
                  <span className="text-sm font-medium leading-snug">{tr(s.name, lang)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-labelledby="sign-title">
          <div className="mr-card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button type="button" className={btn.ghost} onClick={() => setOpen(null)} aria-label="Закрыть">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="flex justify-center">
              <RoadSign id={open.id} size={160} />
            </div>
            <h2 id="sign-title" className="mt-4 text-center text-lg font-semibold">
              {tr(open.name, lang)}
            </h2>
            <p className="text-center text-sm text-mr-muted">{lang === "ru" ? open.name.ro : open.name.ru}</p>
            <p className="mt-3 text-[15px] leading-relaxed">{tr(open.desc, lang)}</p>
            {questionsWithSign(open.id) > 0 && (
              <Link href={`/mreomd/questions?sign=${open.id}&cat=all`} className={`${btn.secondary} mt-4 w-full`}>
                Вопросы с этим знаком ({questionsWithSign(open.id)})
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
