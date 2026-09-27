"use client";

import Link from "next/link";
import { useMemo } from "react";
import { OFFICIAL_BANK_SIZE, TOPICS, examFormatFor } from "../data/meta";
import { IS_DEMO_BANK } from "../data/questions";
import { questionsFor } from "../lib/bank";
import { formatDate, plural, tr } from "../lib/i18n";
import { hardest, percent, progressFor } from "../lib/progress";
import { RANDOM_SIZE, practiceHref } from "../lib/sessions";
import { FAVORITES_ID, useStore } from "../lib/store";
import { Icon } from "../components/Icon";
import { Bar, CategoryPicker, ModeCard, StatTile, btn } from "../components/ui";

export default function Dashboard() {
  const state = useStore();
  const { settings, stats, lists, exams, activeExam } = state;
  const cat = settings.cat;
  const pool = useMemo(() => questionsFor(cat), [cat]);
  const prog = useMemo(() => progressFor(pool, stats), [pool, stats]);
  const format = examFormatFor(cat);
  const fav = lists.find((l) => l.id === FAVORITES_ID);
  const hardCount = useMemo(() => hardest(pool, stats).length, [pool, stats]);
  const recent = exams.slice(0, 4);
  const passed = exams.filter((e) => e.passed).length;
  const tickets = useMemo(
    () => [...new Set(pool.map((q) => q.ticket).filter((t): t is number => typeof t === "number"))].sort((a, b) => a - b),
    [pool],
  );

  return (
    <div className="space-y-8">
      <section className="mr-card relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rotate-45 rounded-3xl bg-[#f7c600]/15" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mr-accent">Теоретический экзамен ASP · Молдова</p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">
              Подготовка к экзамену ПДД
            </h1>
            <p className="mt-2 max-w-xl text-[15px] text-mr-muted">
              Экзамен на время в официальном формате, тренировка по темам, поиск по вопросам, избранное и свои списки,
              заметки и работа над ошибками. Прогресс сохраняется в этом браузере.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/mreomd/exam" className={btn.primary}>
                <Icon name="exam" size={18} />
                {activeExam ? "Продолжить экзамен" : `Экзамен ${cat}`}
              </Link>
              <Link href={prog.seen < prog.total ? practiceHref("new") : practiceHref("random")} className={btn.secondary}>
                <Icon name="play" size={16} />
                {prog.seen === 0 ? "Начать тренировку" : "Продолжить тренировку"}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-mr-line bg-mr-bg/60 p-4">
            <p className="mb-2 text-sm font-semibold">Ваша категория</p>
            <CategoryPicker />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-mr-surface p-2">
                <div className="text-lg font-semibold">{format.questions}</div>
                <div className="text-[11px] text-mr-muted">вопросов</div>
              </div>
              <div className="rounded-xl bg-mr-surface p-2">
                <div className="text-lg font-semibold">{format.minutes}</div>
                <div className="text-[11px] text-mr-muted">минут</div>
              </div>
              <div className="rounded-xl bg-mr-surface p-2">
                <div className="text-lg font-semibold">≤ {format.questions - format.minCorrect}</div>
                <div className="text-[11px] text-mr-muted">ошибки</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {IS_DEMO_BANK && (
        <div className="flex gap-3 rounded-2xl border border-[#f7c600]/60 bg-[#f7c600]/10 p-4 text-sm">
          <span className="text-lg" aria-hidden="true">⚠️</span>
          <p>
            Сейчас загружен <b>временный набор из {pool.length} вопросов</b>, составленных по общим нормам РЦР. Официальная
            база ASP содержит {OFFICIAL_BANK_SIZE} вопросов — она будет подключена вместо этого набора. Все функции
            (экзамен, поиск, списки, статистика) уже работают.
          </p>
        </div>
      )}

      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Изучено"
            value={`${prog.seen} / ${prog.total}`}
            hint={<Bar value={prog.total ? prog.seen / prog.total : 0} className="mt-2" />}
          />
          <StatTile label="Точность ответов" value={percent(prog.accuracy)} hint={`знаете ${prog.known} ${plural(prog.known, "вопрос", "вопроса", "вопросов")}`} tone="good" href="/mreomd/stats" />
          <StatTile label="Ошибки к исправлению" value={prog.mistakes} hint="работа над ошибками" tone={prog.mistakes ? "bad" : undefined} href={practiceHref("mistakes")} />
          <StatTile
            label="Экзамены"
            value={exams.length ? `${passed} / ${exams.length}` : "—"}
            hint={exams.length ? "сдано / всего" : "ещё не сдавали"}
            href="/mreomd/stats"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Режимы тренировки</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModeCard href={practiceHref("new")} icon="bolt" title="Новые вопросы" text="Только те, что вы ещё не решали" count={prog.total - prog.seen} />
          <ModeCard href={practiceHref("mistakes")} icon="refresh" title="Работа над ошибками" text="Вопросы с неверным последним ответом" count={prog.mistakes} />
          <ModeCard href={practiceHref("random")} icon="shuffle" title="Случайные" text={`${RANDOM_SIZE} случайных вопросов с пояснениями`} />
          <ModeCard href={practiceHref("all")} icon="list" title="Марафон" text="Все вопросы категории подряд" count={prog.total} />
          <ModeCard href={practiceHref("list", { list: FAVORITES_ID })} icon="star" title="Избранное" text="Вопросы, отмеченные звёздочкой" count={fav?.qids.length ?? 0} />
          <ModeCard href={practiceHref("hard")} icon="flag" title="Сложные" text="Где вы ошибались чаще всего" count={hardCount} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Темы</h2>
          <Link href="/mreomd/questions" className="text-sm font-medium text-mr-accent">
            Все вопросы →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => {
            const qs = pool.filter((q) => q.topic === t.id);
            if (qs.length === 0) return null;
            const p = progressFor(qs, stats);
            return (
              <Link
                key={t.id}
                href={practiceHref("topic", { topic: t.id })}
                className="mr-card flex flex-col gap-2 p-4 transition-colors hover:border-mr-accent/60"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl leading-none" aria-hidden="true">{t.icon}</span>
                  <span className="flex-1 font-medium leading-snug">{tr(t.name, settings.lang)}</span>
                  <span className="text-xs text-mr-muted tabular-nums">
                    {p.seen}/{p.total}
                  </span>
                </div>
                <Bar value={p.total ? p.known / p.total : 0} tone="good" />
                <div className="flex justify-between text-xs text-mr-muted">
                  <span>точность {percent(p.accuracy)}</span>
                  {p.mistakes > 0 && <span className="text-mr-bad">ошибок: {p.mistakes}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {tickets.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Билеты</h2>
          <div className="flex flex-wrap gap-2">
            {tickets.map((t) => (
              <Link key={t} href={practiceHref("ticket", { ticket: t })} className="mr-card min-w-12 px-3 py-2 text-center text-sm font-medium hover:border-mr-accent/60">
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="mr-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Последние экзамены</h2>
            <Link href="/mreomd/stats" className="text-sm text-mr-accent">История →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-4 text-sm text-mr-muted">Здесь появятся результаты пробных экзаменов.</p>
          ) : (
            <ul className="divide-y divide-mr-line">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/mreomd/exam?result=${e.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-mr-accent">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${e.passed ? "bg-mr-good-soft text-mr-good" : "bg-mr-bad-soft text-mr-bad"}`}>
                      {e.passed ? "Сдан" : "Не сдан"}
                    </span>
                    <span className="tabular-nums">{e.correct}/{e.total}</span>
                    <span className="text-mr-muted">кат. {e.cat}</span>
                    <span className="ml-auto text-xs text-mr-muted">{formatDate(e.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/mreomd/signs" className="mr-card flex flex-col justify-between gap-3 p-4 hover:border-mr-accent/60">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
            <span>
              <span className="block font-semibold">Дорожные знаки</span>
              <span className="text-sm text-mr-muted">Справочник с поиском и режимом карточек</span>
            </span>
          </Link>
          <Link href="/mreomd/info" className="mr-card flex flex-col justify-between gap-3 p-4 hover:border-mr-accent/60">
            <span className="text-2xl" aria-hidden="true">📋</span>
            <span>
              <span className="block font-semibold">Как проходит экзамен</span>
              <span className="text-sm text-mr-muted">Формат ASP, категории, запись и полезные ссылки</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
