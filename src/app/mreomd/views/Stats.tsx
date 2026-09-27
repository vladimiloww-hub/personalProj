"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { TOPICS, examFormatFor } from "../data/meta";
import { questionsFor } from "../lib/bank";
import { formatDate, formatDuration, tr } from "../lib/i18n";
import { hardest, percent, progressFor } from "../lib/progress";
import { practiceHref } from "../lib/sessions";
import {
  exportState,
  importState,
  resetAll,
  resetProgress,
  setSettings,
  useHydrated,
  useStore,
  type ExamRecord,
} from "../lib/store";
import { Icon } from "../components/Icon";
import QuestionRow from "../components/QuestionRow";
import { LangToggle } from "../components/Shell";
import { Bar, PageTitle, StatTile, Toggle, btn } from "../components/ui";

export default function Stats() {
  const hydrated = useHydrated();
  const state = useStore();
  const { settings, stats, exams } = state;
  const pool = useMemo(() => questionsFor(settings.cat), [settings.cat]);
  const prog = progressFor(pool, stats);
  const attempts = Object.values(stats).reduce((n, s) => n + s.seen, 0);
  const hard = useMemo(() => hardest(pool, stats, 10), [pool, stats]);
  const passed = exams.filter((e) => e.passed).length;

  if (!hydrated) return <div className="mr-card h-96 animate-pulse" aria-busy="true" />;

  return (
    <div className="space-y-8">
      <PageTitle title="Статистика" subtitle={`Категория ${settings.cat}. Всё хранится только в этом браузере — сделайте резервную копию, чтобы перенести прогресс.`} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Изучено вопросов" value={`${prog.seen} из ${prog.total}`} hint={<Bar value={prog.total ? prog.seen / prog.total : 0} className="mt-2" />} />
        <StatTile label="Знаю" value={prog.known} hint="последний ответ верный" tone="good" />
        <StatTile label="Точность" value={percent(prog.accuracy)} hint={`${attempts} ответов всего`} />
        <StatTile label="Экзамены сданы" value={exams.length ? `${passed} из ${exams.length}` : "—"} hint={exams.length ? percent(passed / exams.length) : "пройдите первый"} href="/mreomd/exam" />
      </section>

      <section className="mr-card p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Результаты экзаменов</h2>
          <span className="text-xs text-mr-muted">последние {Math.min(exams.length, 20)}, % верных ответов</span>
        </div>
        {exams.length === 0 ? (
          <p className="py-6 text-center text-sm text-mr-muted">
            Пройдите{" "}
            <Link href="/mreomd/exam" className="text-mr-accent">
              пробный экзамен
            </Link>
            , и здесь появится динамика результатов.
          </p>
        ) : (
          <>
            <ExamChart exams={exams.slice(0, 20).reverse()} />
            <ExamTable exams={exams} />
          </>
        )}
      </section>

      <section className="mr-card p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Прогресс по темам</h2>
        <div className="divide-y divide-mr-line">
          {TOPICS.map((t) => {
            const qs = pool.filter((q) => q.topic === t.id);
            if (!qs.length) return null;
            const p = progressFor(qs, stats);
            return (
              <Link key={t.id} href={practiceHref("topic", { topic: t.id })} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:text-mr-accent sm:grid-cols-[minmax(0,1fr)_200px_auto]">
                <span className="truncate text-sm">
                  <span aria-hidden="true">{t.icon}</span> {tr(t.name, settings.lang)}
                </span>
                <span className="order-3 col-span-2 sm:order-none sm:col-span-1">
                  <Bar value={p.total ? p.known / p.total : 0} tone="good" />
                </span>
                <span className="text-right text-xs tabular-nums text-mr-muted">
                  {p.known}/{p.total} · {percent(p.accuracy)}
                  {p.mistakes > 0 && <span className="ml-1 text-mr-bad">· ✗{p.mistakes}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {hard.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Самые сложные для вас</h2>
            <Link href={practiceHref("hard")} className="text-sm font-medium text-mr-accent">
              Тренировать →
            </Link>
          </div>
          <div className="space-y-2">
            {hard.map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                extraAction={
                  <span className="mr-1 text-xs tabular-nums text-mr-bad" title="Ошибок / попыток">
                    {stats[q.id].wrong}/{stats[q.id].seen}
                  </span>
                }
              />
            ))}
          </div>
        </section>
      )}

      <Settings />
    </div>
  );
}

function ExamChart({ exams }: { exams: ExamRecord[] }) {
  const router = useRouter();
  const { settings } = useStore();
  const [hover, setHover] = useState<number | null>(null);
  const f = examFormatFor(settings.cat);
  const pass = f.minCorrect / f.questions;
  const h = 160;

  return (
    <figure>
      <div className="relative ml-9" style={{ height: h }}>
        {[0, 0.5, 1].map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-mr-line" style={{ bottom: t * h }}>
            <span className="absolute -left-9 -translate-y-1/2 text-[11px] tabular-nums text-mr-muted">{t * 100}%</span>
          </div>
        ))}
        <div className="absolute inset-x-0 z-10 border-t border-dashed border-mr-text/50" style={{ bottom: pass * h }}>
          <span className="absolute right-0 -translate-y-full pb-0.5 text-[11px] text-mr-muted">
            проходной: {f.minCorrect}/{f.questions}
          </span>
        </div>
        <div className="absolute inset-0 flex items-end justify-around gap-[2px]">
          {exams.map((e, i) => {
            const v = e.total ? e.correct / e.total : 0;
            return (
              <button
                key={e.id}
                type="button"
                className="relative flex h-full max-w-6 flex-1 items-end justify-center outline-none"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((x) => (x === i ? null : x))}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((x) => (x === i ? null : x))}
                onClick={() => router.push(`/mreomd/exam?result=${e.id}`)}
                aria-label={`${formatDate(e.at)}: ${e.correct} из ${e.total}, ${e.passed ? "сдан" : "не сдан"}`}
              >
                <span
                  className={`block w-full rounded-t-[4px] bg-mr-chart transition-opacity ${hover !== null && hover !== i ? "opacity-40" : ""}`}
                  style={{ height: Math.max(2, v * h) }}
                />
                {hover === i && (
                  <span className="pointer-events-none absolute bottom-full z-20 mb-1 whitespace-nowrap rounded-lg border border-mr-line bg-mr-surface px-2 py-1 text-left text-xs shadow-lg">
                    <b className="block text-sm">
                      {e.correct}/{e.total}
                    </b>
                    <span className="block text-mr-muted">
                      {e.passed ? "✓ сдан" : "✗ не сдан"} · кат. {e.cat}
                    </span>
                    <span className="block text-mr-muted">{formatDate(e.at)}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <figcaption className="sr-only">Столбцы — доля верных ответов в каждом экзамене, линия — проходной балл.</figcaption>
    </figure>
  );
}

function ExamTable({ exams }: { exams: ExamRecord[] }) {
  const [all, setAll] = useState(false);
  const rows = all ? exams : exams.slice(0, 8);
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-mr-line text-left text-xs text-mr-muted">
            <th className="py-2 font-medium">Дата</th>
            <th className="py-2 font-medium">Кат.</th>
            <th className="py-2 text-right font-medium">Результат</th>
            <th className="py-2 text-right font-medium">Время</th>
            <th className="py-2 pl-4 font-medium">Итог</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-mr-line/60">
              <td className="py-2">
                <Link href={`/mreomd/exam?result=${e.id}`} className="hover:text-mr-accent">
                  {formatDate(e.at)}
                </Link>
              </td>
              <td className="py-2">{e.cat}</td>
              <td className="py-2 text-right tabular-nums">
                {e.correct}/{e.total}
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatDuration(e.durationSec)}
                {e.timeout && " ⏱"}
              </td>
              <td className="py-2 pl-4">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${e.passed ? "bg-mr-good-soft text-mr-good" : "bg-mr-bad-soft text-mr-bad"}`}>
                  <Icon name={e.passed ? "check" : "x"} size={12} strokeWidth={3} />
                  {e.passed ? "Сдан" : "Не сдан"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {exams.length > 8 && (
        <button type="button" className={`${btn.ghost} mt-2`} onClick={() => setAll((v) => !v)}>
          {all ? "Свернуть" : `Показать все (${exams.length})`}
        </button>
      )}
    </div>
  );
}

function Settings() {
  const { settings } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mreomd-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: "Файл с прогрессом сохранён." });
  };

  const upload = async (file: File) => {
    try {
      const text = await file.text();
      if (!window.confirm("Заменить текущий прогресс, списки и заметки данными из файла?")) return;
      importState(text);
      setMsg({ ok: true, text: "Прогресс восстановлен из файла." });
    } catch {
      setMsg({ ok: false, text: "Не удалось прочитать файл — это должен быть JSON, сохранённый на этой странице." });
    }
  };

  return (
    <section id="settings" className="mr-card p-4 sm:p-5">
      <h2 className="mb-2 font-semibold">Настройки</h2>
      <div className="flex flex-wrap items-center gap-3 border-b border-mr-line pb-3">
        <span className="text-sm">Язык вопросов</span>
        <LangToggle />
        <span className="ml-4 text-sm">Тема</span>
        <select
          value={settings.theme}
          onChange={(e) => setSettings({ theme: e.target.value as typeof settings.theme })}
          className="rounded-lg border border-mr-line bg-mr-bg px-2 py-1.5 text-sm"
          aria-label="Тема оформления"
        >
          <option value="system">Как в системе</option>
          <option value="light">Светлая</option>
          <option value="dark">Тёмная</option>
        </select>
      </div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Toggle checked={settings.shuffle} onChange={(v) => setSettings({ shuffle: v })} label="Перемешивать варианты ответов" hint="В тренировке и на экзамене" />
        <Toggle checked={settings.autoNext} onChange={(v) => setSettings({ autoNext: v })} label="Автопереход после верного ответа" hint="Только в тренировке" />
        <Toggle checked={settings.strict} onChange={(v) => setSettings({ strict: v })} label="Строгий режим экзамена" hint="Завершать при превышении допустимых ошибок" />
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold">Резервная копия</h3>
      <p className="mb-3 text-sm text-mr-muted">
        Сохраните файл, чтобы перенести прогресс, списки и заметки на другое устройство или в другой браузер.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={download}>
          <Icon name="download" size={16} /> Скачать прогресс
        </button>
        <button type="button" className={btn.secondary} onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={16} /> Загрузить из файла
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-mr-good" : "text-mr-bad"}`} role="status">
          {msg.text}
        </p>
      )}

      <h3 className="mb-2 mt-5 text-sm font-semibold">Сброс</h3>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btn.danger}
          onClick={() => {
            if (window.confirm("Сбросить статистику ответов и историю экзаменов? Списки и заметки останутся.")) resetProgress();
          }}
        >
          Сбросить статистику
        </button>
        <button
          type="button"
          className={btn.danger}
          onClick={() => {
            if (window.confirm("Удалить всё: статистику, экзамены, списки, заметки и настройки?")) resetAll();
          }}
        >
          Удалить все данные
        </button>
      </div>
    </section>
  );
}
