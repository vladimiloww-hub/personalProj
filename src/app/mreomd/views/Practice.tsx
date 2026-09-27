"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOPICS } from "../data/meta";
import { answerOrder, questionsFor } from "../lib/bank";
import { plural, tr } from "../lib/i18n";
import { hardest, percent, progressFor } from "../lib/progress";
import {
  RANDOM_SIZE,
  buildSession,
  isPracticeMode,
  practiceHref,
  stashCustomSession,
  type PracticeSession,
} from "../lib/sessions";
import { FAVORITES_ID, getState, recordAnswer, setSettings, toggleInList, useHydrated, useStore } from "../lib/store";
import { Icon } from "../components/Icon";
import QuestionCard from "../components/QuestionCard";
import { celebrateCorrect } from "../components/StickerBurst";
import { Bar, Empty, ModeCard, PageTitle, Toggle, btn } from "../components/ui";

export default function Practice() {
  const params = useSearchParams();
  const mode = params.get("mode");
  if (!isPracticeMode(mode)) return <ModePicker />;
  return <PracticeRun key={params.toString()} />;
}

function ModePicker() {
  const { settings, stats, lists } = useStore();
  const pool = useMemo(() => questionsFor(settings.cat), [settings.cat]);
  const prog = progressFor(pool, stats);
  const hardCount = hardest(pool, stats).length;
  return (
    <div>
      <PageTitle title="Тренировка" subtitle={`Категория ${settings.cat}: ответ проверяется сразу, с пояснением. Каждый ответ идёт в статистику.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ModeCard href={practiceHref("new")} icon="bolt" title="Новые вопросы" text="Только те, что вы ещё не решали" count={prog.total - prog.seen} />
        <ModeCard href={practiceHref("mistakes")} icon="refresh" title="Работа над ошибками" text="Вопросы с неверным последним ответом" count={prog.mistakes} />
        <ModeCard href={practiceHref("random")} icon="shuffle" title="Случайные" text={`${RANDOM_SIZE} случайных вопросов`} />
        <ModeCard href={practiceHref("all")} icon="list" title="Марафон" text="Все вопросы категории подряд" count={prog.total} />
        <ModeCard href={practiceHref("hard")} icon="flag" title="Сложные" text="Где вы ошибались чаще всего" count={hardCount} />
        {lists.map((l) => (
          <ModeCard
            key={l.id}
            href={practiceHref("list", { list: l.id })}
            icon={l.id === FAVORITES_ID ? "star" : "folder"}
            title={l.name}
            text={l.id === FAVORITES_ID ? "Вопросы со звёздочкой" : "Ваш список"}
            count={l.qids.length}
          />
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">По темам</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => {
          const qs = pool.filter((q) => q.topic === t.id);
          if (!qs.length) return null;
          const p = progressFor(qs, stats);
          return (
            <Link
              key={t.id}
              href={practiceHref("topic", { topic: t.id })}
              className="mr-card flex items-center gap-3 px-4 py-3 hover:border-mr-accent/60"
            >
              <span className="text-lg" aria-hidden="true">{t.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{tr(t.name, settings.lang)}</span>
                <Bar value={p.total ? p.known / p.total : 0} tone="good" className="mt-1.5" />
              </span>
              <span className="text-xs tabular-nums text-mr-muted">{p.seen}/{p.total}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PracticeRun() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const { settings } = useStore();
  const [restart, setRestart] = useState(0);
  const [session, setSession] = useState<(PracticeSession & { token: number }) | null>(null);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [noteOpen, setNoteOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the question set once the viewer's saved progress is loaded, then freeze it
  // (e.g. "mistakes" must not shrink while you are answering).
  if (hydrated && (!session || session.token !== restart)) {
    const mode = params.get("mode");
    if (isPracticeMode(mode)) {
      setSession({
        ...buildSession(mode, { topic: params.get("topic"), list: params.get("list"), ticket: params.get("ticket") }, getState()),
        token: restart,
      });
      setPos(0);
      setAnswers({});
    }
  }

  const questions = session?.questions ?? [];
  const finished = questions.length > 0 && pos >= questions.length;
  const q = finished ? undefined : questions[pos];
  const selected = q ? (answers[q.id] ?? null) : null;
  const order = useMemo(() => (q ? answerOrder(q, settings.shuffle, seed) : []), [q, settings.shuffle, seed]);
  const done = Object.keys(answers).length;
  const right = questions.filter((x) => answers[x.id] === x.c).length;
  const wrongIds = questions.filter((x) => answers[x.id] !== undefined && answers[x.id] !== x.c).map((x) => x.id);

  const go = useCallback(
    (to: number) => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setNoteOpen(false);
      setPos(Math.max(0, Math.min(questions.length, to)));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [questions.length],
  );

  const choose = useCallback(
    (a: number) => {
      if (!q || answers[q.id] !== undefined) return;
      const ok = a === q.c;
      setAnswers((prev) => ({ ...prev, [q.id]: a }));
      recordAnswer(q.id, ok);
      if (ok) celebrateCorrect();
      if (ok && settings.autoNext) {
        autoTimer.current = setTimeout(() => go(pos + 1), 700);
      }
    },
    [q, answers, settings.autoNext, go, pos],
  );

  useEffect(() => () => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      if (!q) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) {
        choose(order[n - 1]);
      } else if (e.key === "ArrowRight" || (e.key === "Enter" && selected !== null)) {
        e.preventDefault();
        go(pos + 1);
      } else if (e.key === "ArrowLeft") {
        go(pos - 1);
      } else if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "ы") {
        toggleInList(FAVORITES_ID, q.id);
      } else if (e.key.toLowerCase() === "n" || e.key.toLowerCase() === "т") {
        e.preventDefault();
        setNoteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, order, choose, go, pos, selected]);

  if (!session) {
    return <div className="mr-card h-96 animate-pulse" aria-busy="true" />;
  }

  const header = (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Link href="/mreomd/practice" className={btn.ghost} aria-label="Все режимы">
        <Icon name="left" size={18} />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold sm:text-xl">{session.title}</h1>
        {session.subtitle && <p className="truncate text-sm text-mr-muted">{session.subtitle}</p>}
      </div>
      {questions.length > 0 && (
        <div className="flex items-center gap-3 text-sm tabular-nums">
          <span className="text-mr-good" title="Верно">✓ {right}</span>
          <span className="text-mr-bad" title="Неверно">✗ {done - right}</span>
          <button type="button" className={btn.ghost} onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings} aria-label="Настройки тренировки">
            <Icon name="filter" size={18} />
          </button>
        </div>
      )}
    </div>
  );

  if (questions.length === 0) {
    return (
      <div>
        {header}
        <Empty
          icon="check"
          title="Здесь пока пусто"
          text={session.empty}
          action={
            <Link href="/mreomd/practice" className={btn.secondary}>
              Выбрать другой режим
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {header}

      {showSettings && (
        <div className="mr-card mb-4 px-4 py-2">
          <Toggle
            checked={settings.shuffle}
            onChange={(v) => setSettings({ shuffle: v })}
            label="Перемешивать варианты ответов"
            hint="Помогает запоминать ответ, а не его позицию"
          />
          <Toggle
            checked={settings.autoNext}
            onChange={(v) => setSettings({ autoNext: v })}
            label="Автопереход после верного ответа"
          />
          <p className="pb-2 pt-1 text-xs text-mr-muted">
            Клавиши: <b>1–5</b> — ответ, <b>Enter</b>/<b>→</b> — далее, <b>←</b> — назад, <b>S</b> — избранное, <b>N</b> — заметка.
          </p>
        </div>
      )}

      <nav className="mr-scroll-x -mx-1 mb-3 flex gap-1 overflow-x-auto px-1 py-1" aria-label="Вопросы тренировки">
        {questions.map((x, i) => {
          const a = answers[x.id];
          const tone =
            a === undefined ? "bg-mr-surface border-mr-line text-mr-muted" : a === x.c ? "bg-mr-good-soft border-mr-good text-mr-good" : "bg-mr-bad-soft border-mr-bad text-mr-bad";
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => go(i)}
              aria-current={i === pos ? "step" : undefined}
              className={`h-8 min-w-8 shrink-0 rounded-lg border px-1 text-xs font-medium tabular-nums ${tone} ${
                i === pos ? "ring-2 ring-mr-accent ring-offset-1 ring-offset-mr-bg" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      {finished ? (
        <div className="mr-card p-6 text-center">
          <p className="text-sm text-mr-muted">Тренировка завершена</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {right} <span className="text-mr-muted">/ {questions.length}</span>
          </p>
          <p className="mt-1 text-mr-muted">
            верных ответов · {percent(done ? right / done : null)}
            {done < questions.length && ` · пропущено ${questions.length - done}`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {wrongIds.length > 0 && (
              <button
                type="button"
                className={btn.primary}
                onClick={() => {
                  stashCustomSession(`Ошибки: ${session.title.replace(/^Ошибки: /, "")}`, wrongIds);
                  if (params.get("mode") === "custom") setRestart((r) => r + 1);
                  else router.push(practiceHref("custom"));
                }}
              >
                Повторить ошибки ({wrongIds.length})
              </button>
            )}
            <button type="button" className={btn.secondary} onClick={() => setRestart((r) => r + 1)}>
              <Icon name="refresh" size={16} /> Заново
            </button>
            <Link href="/mreomd/practice" className={btn.secondary}>
              Другие режимы
            </Link>
          </div>
        </div>
      ) : (
        q && (
          <>
            <QuestionCard
              key={q.id}
              q={q}
              lang={settings.lang}
              order={order}
              selected={selected}
              reveal={selected !== null}
              onSelect={choose}
              noteOpen={noteOpen}
              onNoteOpenChange={setNoteOpen}
              heading={
                <span className="font-medium text-mr-text">
                  Вопрос {pos + 1} из {questions.length}
                </span>
              }
            />
            <div className="mt-4 flex items-center gap-2">
              <button type="button" className={btn.secondary} onClick={() => go(pos - 1)} disabled={pos === 0}>
                <Icon name="left" size={16} /> Назад
              </button>
              <span className="flex-1 text-center text-xs text-mr-muted">
                {done} {plural(done, "ответ", "ответа", "ответов")} из {questions.length}
              </span>
              <button type="button" className={selected !== null ? btn.primary : btn.secondary} onClick={() => go(pos + 1)}>
                {pos === questions.length - 1 ? "Завершить" : selected !== null ? "Далее" : "Пропустить"}
                <Icon name="right" size={16} />
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}
