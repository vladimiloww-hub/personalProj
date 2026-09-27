"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_BY_CODE, examFormatFor } from "../data/meta";
import { QUESTION_BY_ID, answerOrder, pickExamQuestions, questionsFor } from "../lib/bank";
import { formatDate, formatDuration, plural } from "../lib/i18n";
import { practiceHref, stashCustomSession } from "../lib/sessions";
import {
  FAVORITES_ID,
  LIST_COLORS,
  addExamRecord,
  addManyToList,
  answerActiveExam,
  createList,
  getState,
  recordAnswer,
  setActiveExam,
  setSettings,
  useHydrated,
  useStore,
  type ActiveExam,
  type ExamRecord,
} from "../lib/store";
import type { Question } from "../lib/types";
import { Icon } from "../components/Icon";
import PrizeBoard, { cellOpenedBy } from "../components/PrizeBoard";
import QuestionCard from "../components/QuestionCard";
import { CategoryPicker, Empty, PageTitle, Toggle, btn } from "../components/ui";

export default function Exam() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const { activeExam, exams } = useStore();
  const resultId = params.get("result");

  if (!hydrated) return <div className="mr-card h-96 animate-pulse" aria-busy="true" />;

  if (resultId) {
    const rec = exams.find((e) => e.id === resultId);
    return rec ? (
      <ExamResult key={rec.id} rec={rec} />
    ) : (
      <Empty
        title="Результат не найден"
        text="Возможно, история была очищена."
        action={
          <Link className={btn.primary} href="/mreomd/exam">
            Новый экзамен
          </Link>
        }
      />
    );
  }
  if (activeExam) return <ExamRun key={activeExam.startedAt} exam={activeExam} />;
  return <ExamStart />;
}

function ExamStart() {
  const { settings, exams } = useStore();
  const cat = settings.cat;
  const format = examFormatFor(cat);
  const pool = useMemo(() => questionsFor(cat), [cat]);
  const count = Math.min(format.questions, pool.length);
  const allowed = format.questions - format.minCorrect;

  const start = () => {
    const picked = pickExamQuestions(pool, count);
    const now = Date.now();
    setActiveExam({
      cat,
      qids: picked.map((q) => q.id),
      answers: {},
      startedAt: now,
      deadline: now + format.minutes * 60_000,
    });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Пробный экзамен" subtitle="Как в экзаменационном классе ASP: вопросы из разных тем, ограничение по времени, результат в конце." />
      <div className="mr-card space-y-5 p-5">
        <div>
          <p className="mb-2 text-sm font-semibold">Категория</p>
          <CategoryPicker />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-mr-surface-2 p-3">
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs text-mr-muted">{plural(count, "вопрос", "вопроса", "вопросов")}</div>
          </div>
          <div className="rounded-xl bg-mr-surface-2 p-3">
            <div className="text-2xl font-bold">{format.minutes}</div>
            <div className="text-xs text-mr-muted">минут</div>
          </div>
          <div className="rounded-xl bg-mr-surface-2 p-3">
            <div className="text-2xl font-bold">{format.minCorrect}</div>
            <div className="text-xs text-mr-muted">верных для сдачи</div>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm text-mr-muted">
          <li>• Можно ошибиться не более чем в {allowed} {plural(allowed, "вопросе", "вопросах", "вопросах")}; пропущенный вопрос считается ошибкой.</li>
          <li>• Ответ фиксируется сразу после выбора. Вопрос можно пропустить и вернуться к нему позже.</li>
          <li>• Правильные ответы и пояснения — после завершения. Экзамен сохраняется, если случайно закрыть вкладку.</li>
        </ul>
        {count < format.questions && (
          <p className="rounded-xl bg-mr-bad-soft px-3 py-2 text-sm text-mr-bad">
            В базе для категории {cat} только {pool.length} вопросов — билет будет короче официального.
          </p>
        )}
        <div className="border-t border-mr-line pt-3">
          <Toggle
            checked={settings.strict}
            onChange={(v) => setSettings({ strict: v })}
            label="Строгий режим"
            hint={`Экзамен завершается сразу, как только допущено больше ${allowed} ${plural(allowed, "ошибки", "ошибок", "ошибок")}`}
          />
          <Toggle checked={settings.shuffle} onChange={(v) => setSettings({ shuffle: v })} label="Перемешивать варианты ответов" />
        </div>
        <button type="button" onClick={start} disabled={count === 0} className={`${btn.primary} w-full py-3 text-base`}>
          <Icon name="play" size={18} /> Начать экзамен
        </button>
      </div>

      {exams.length > 0 && (
        <p className="mt-4 text-center text-sm text-mr-muted">
          Сдано {exams.filter((e) => e.passed).length} из {exams.length} пробных экзаменов ·{" "}
          <Link href="/mreomd/stats" className="text-mr-accent">
            история
          </Link>
        </p>
      )}
    </div>
  );
}

function ExamRun({ exam }: { exam: ActiveExam }) {
  const router = useRouter();
  const { settings } = useStore();
  const questions = useMemo(
    () => exam.qids.map((id) => QUESTION_BY_ID[id]).filter((q): q is Question => Boolean(q)),
    [exam.qids],
  );
  const format = examFormatFor(exam.cat);
  const total = questions.length;
  const minCorrect = Math.max(0, format.minCorrect - (format.questions - total));
  const allowed = total - minCorrect;
  const firstOpen = Math.max(0, questions.findIndex((q) => exam.answers[q.id] === undefined));
  const [pos, setPos] = useState(firstOpen);
  const [now, setNow] = useState(() => Date.now());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const finishedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answered = questions.filter((q) => exam.answers[q.id] !== undefined).length;
  const errors = questions.filter((q) => exam.answers[q.id] !== undefined && exam.answers[q.id] !== q.c).length;
  const remaining = Math.max(0, exam.deadline - now);
  const q = questions[pos];
  const order = useMemo(() => (q ? answerOrder(q, settings.shuffle, exam.startedAt) : []), [q, settings.shuffle, exam.startedAt]);

  const finish = useCallback(
    (timeout: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const current = getState().activeExam ?? exam;
      const correct = questions.filter((x) => current.answers[x.id] === x.c).length;
      for (const x of questions) {
        const a = current.answers[x.id];
        if (a !== undefined) recordAnswer(x.id, a === x.c);
      }
      const rec: ExamRecord = {
        id: `e${Date.now().toString(36)}`,
        at: Date.now(),
        cat: current.cat,
        total,
        correct,
        minCorrect,
        durationSec: Math.round((Math.min(Date.now(), current.deadline) - current.startedAt) / 1000),
        passed: correct >= minCorrect,
        timeout,
        qids: questions.map((x) => x.id),
        wrong: questions.filter((x) => current.answers[x.id] !== x.c).map((x) => x.id),
        answers: current.answers,
      };
      addExamRecord(rec);
      router.replace(`/mreomd/exam?result=${rec.id}`);
      window.scrollTo({ top: 0 });
    },
    [exam, questions, total, minCorrect, router],
  );

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining <= 0) finish(true);
  }, [remaining, finish]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const nextOpen = useCallback(
    (from: number, answers: Record<string, number>) => {
      for (let k = 1; k <= total; k++) {
        const i = (from + k) % total;
        if (answers[questions[i].id] === undefined) return i;
      }
      return -1;
    },
    [questions, total],
  );

  const choose = useCallback(
    (a: number) => {
      if (!q || exam.answers[q.id] !== undefined) return;
      answerActiveExam(q.id, a);
      const answers = { ...exam.answers, [q.id]: a };
      const errs = questions.filter((x) => answers[x.id] !== undefined && answers[x.id] !== x.c).length;
      if (settings.strict && errs > allowed) {
        finish(false);
        return;
      }
      const next = nextOpen(pos, answers);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (next === -1) {
        setConfirmFinish(true);
      } else {
        advanceTimer.current = setTimeout(() => setPos(next), 350);
      }
    },
    [q, exam.answers, questions, settings.strict, allowed, finish, nextOpen, pos],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) choose(order[n - 1]);
      else if (e.key === "ArrowRight") setPos((p) => Math.min(total - 1, p + 1));
      else if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, choose, total]);

  const low = remaining < 3 * 60_000;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-14 z-20 -mx-4 mb-4 border-b border-mr-line bg-mr-bg/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Экзамен · категория {exam.cat}
            </p>
            <p className="text-xs text-mr-muted">
              Отвечено {answered} из {total}
              {settings.strict && ` · ошибок ${errors} из ${allowed} допустимых`}
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-lg font-semibold tabular-nums ${
              low ? "bg-mr-bad-soft text-mr-bad" : "bg-mr-surface-2"
            }`}
            role="timer"
            aria-live={low ? "polite" : "off"}
            aria-label={`Осталось ${formatDuration(remaining / 1000)}`}
          >
            <Icon name="clock" size={18} />
            {formatDuration(remaining / 1000)}
          </div>
          <button type="button" className={btn.primary} onClick={() => setConfirmFinish(true)}>
            Завершить
          </button>
        </div>
        <div className="mt-2 grid grid-cols-12 gap-1 sm:grid-cols-[repeat(24,minmax(0,1fr))]" role="list" aria-label="Вопросы экзамена">
          {questions.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="listitem"
              onClick={() => setPos(i)}
              aria-current={i === pos ? "step" : undefined}
              aria-label={`Вопрос ${i + 1}${exam.answers[x.id] !== undefined ? ", есть ответ" : ""}`}
              className={`h-7 rounded-md text-[11px] font-medium tabular-nums transition-colors ${
                exam.answers[x.id] !== undefined ? "bg-mr-accent text-mr-accent-ink" : "bg-mr-surface-2 text-mr-muted"
              } ${i === pos ? "ring-2 ring-mr-text ring-offset-1 ring-offset-mr-bg" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {q && (
        <QuestionCard
          key={q.id}
          q={q}
          lang={settings.lang}
          order={order}
          selected={exam.answers[q.id] ?? null}
          onSelect={exam.answers[q.id] === undefined ? choose : undefined}
          heading={
            <span className="font-medium text-mr-text">
              Вопрос {pos + 1} из {total}
            </span>
          }
        />
      )}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" className={btn.secondary} onClick={() => setPos((p) => Math.max(0, p - 1))} disabled={pos === 0}>
          <Icon name="left" size={16} />
        </button>
        <button
          type="button"
          className={`${btn.secondary} flex-1`}
          onClick={() => {
            const next = nextOpen(pos, exam.answers);
            if (next === -1) setConfirmFinish(true);
            else setPos(next);
          }}
        >
          {q && exam.answers[q.id] === undefined ? "Пропустить" : "К следующему без ответа"}
        </button>
        <button type="button" className={btn.secondary} onClick={() => setPos((p) => Math.min(total - 1, p + 1))} disabled={pos === total - 1}>
          <Icon name="right" size={16} />
        </button>
      </div>
      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-sm text-mr-muted underline-offset-2 hover:text-mr-bad hover:underline"
          onClick={() => {
            if (window.confirm("Прервать экзамен? Результат не сохранится.")) setActiveExam(null);
          }}
        >
          Прервать без сохранения
        </button>
      </div>

      {confirmFinish && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <div className="mr-card w-full max-w-sm p-5">
            <h2 id="finish-title" className="text-lg font-semibold">
              Завершить экзамен?
            </h2>
            <p className="mt-1 text-sm text-mr-muted">
              {answered < total
                ? `Без ответа ${total - answered} ${plural(total - answered, "вопрос", "вопроса", "вопросов")} — они будут засчитаны как ошибки.`
                : "Вы ответили на все вопросы."}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className={`${btn.secondary} flex-1`} onClick={() => setConfirmFinish(false)} autoFocus>
                Вернуться
              </button>
              <button type="button" className={`${btn.primary} flex-1`} onClick={() => finish(false)}>
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamResult({ rec }: { rec: ExamRecord }) {
  const router = useRouter();
  const { settings, exams } = useStore();
  const prizeCell = cellOpenedBy(exams, rec);
  const [onlyWrong, setOnlyWrong] = useState(rec.wrong.length > 0);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const questions = rec.qids.map((id) => QUESTION_BY_ID[id]).filter((q): q is Question => Boolean(q));
  const shown = onlyWrong ? questions.filter((q) => rec.wrong.includes(q.id)) : questions;
  const cat = CATEGORY_BY_CODE[rec.cat];
  const unanswered = questions.filter((q) => rec.answers[q.id] === undefined).length;

  const saveWrong = (target: "fav" | "new") => {
    if (target === "fav") {
      addManyToList(FAVORITES_ID, rec.wrong);
      setSavedTo("Избранное");
    } else {
      const name = `Ошибки экзамена ${new Date(rec.at).toLocaleDateString("ru-RU")}`;
      const id = createList(name, LIST_COLORS[3]);
      addManyToList(id, rec.wrong);
      setSavedTo(name);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className={`mr-card overflow-hidden`}>
        <div className={`px-5 py-6 text-center ${rec.passed ? "bg-mr-good-soft" : "bg-mr-bad-soft"}`}>
          <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${rec.passed ? "text-mr-good" : "text-mr-bad"}`}>
            {rec.passed ? "Admis · Сдан" : "Respins · Не сдан"}
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums">
            {rec.correct}
            <span className="text-2xl text-mr-muted"> / {rec.total}</span>
          </p>
          <p className="mt-1 text-sm text-mr-muted">
            нужно не менее {rec.minCorrect} · категория {rec.cat}
            {cat ? ` (${cat.name.ru})` : ""}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-mr-line border-t border-mr-line text-center text-sm">
          <div className="p-3">
            <div className="font-semibold text-mr-bad">{rec.wrong.length}</div>
            <div className="text-xs text-mr-muted">{unanswered ? `ошибок (без ответа ${unanswered})` : "ошибок"}</div>
          </div>
          <div className="p-3">
            <div className="font-semibold">{formatDuration(rec.durationSec)}</div>
            <div className="text-xs text-mr-muted">{rec.timeout ? "время вышло" : "затрачено"}</div>
          </div>
          <div className="p-3">
            <div className="font-semibold">{formatDate(rec.at).split(",")[0]}</div>
            <div className="text-xs text-mr-muted">{formatDate(rec.at).split(", ")[1]}</div>
          </div>
        </div>
      </div>

      {prizeCell !== null && (
        <div className="mt-4 space-y-3">
          <p className="rounded-2xl bg-mr-good-soft px-4 py-3 text-center font-semibold text-mr-good">
            Умничка, любовь моя! Открыта ячейка {prizeCell} 🎁
          </p>
          <PrizeBoard exams={exams} highlight={prizeCell} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/mreomd/exam" className={btn.primary}>
          <Icon name="refresh" size={16} /> Новый экзамен
        </Link>
        {rec.wrong.length > 0 && (
          <>
            <button
              type="button"
              className={btn.secondary}
              onClick={() => {
                stashCustomSession("Ошибки экзамена", rec.wrong);
                router.push(practiceHref("custom"));
              }}
            >
              Разобрать ошибки
            </button>
            <button type="button" className={btn.secondary} onClick={() => saveWrong("fav")}>
              <Icon name="star" size={16} /> Ошибки в избранное
            </button>
            <button type="button" className={btn.secondary} onClick={() => saveWrong("new")}>
              <Icon name="folder" size={16} /> В новый список
            </button>
          </>
        )}
      </div>
      {savedTo && (
        <p className="mt-2 text-sm text-mr-good" role="status">
          Сохранено в «{savedTo}».{" "}
          <Link href="/mreomd/saved" className="underline">
            Открыть сохранённые
          </Link>
        </p>
      )}

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Разбор вопросов</h2>
        <div className="flex rounded-lg border border-mr-line bg-mr-surface p-0.5 text-sm">
          <button type="button" onClick={() => setOnlyWrong(true)} aria-pressed={onlyWrong} className={`rounded-md px-3 py-1 ${onlyWrong ? "bg-mr-surface-2 font-medium" : "text-mr-muted"}`}>
            Ошибки ({rec.wrong.length})
          </button>
          <button type="button" onClick={() => setOnlyWrong(false)} aria-pressed={!onlyWrong} className={`rounded-md px-3 py-1 ${!onlyWrong ? "bg-mr-surface-2 font-medium" : "text-mr-muted"}`}>
            Все ({questions.length})
          </button>
        </div>
      </div>
      {shown.length === 0 ? (
        <Empty icon="check" title="Ни одной ошибки!" text="Отличный результат. Попробуйте ещё один экзамен." />
      ) : (
        <div className="space-y-4">
          {shown.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              lang={settings.lang}
              selected={rec.answers[q.id] ?? null}
              reveal
              showCorrect
              explanation="toggle"
              heading={
                <span className="font-medium text-mr-text">
                  Вопрос {rec.qids.indexOf(q.id) + 1}
                  {rec.answers[q.id] === undefined && <span className="ml-2 text-mr-bad">без ответа</span>}
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
