"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { TOPICS, TOPIC_BY_ID } from "../data/meta";
import { SIGN_BY_ID } from "../data/signs";
import { QUESTIONS, QUESTION_NO, appliesToCategory } from "../lib/bank";
import { plural, tr } from "../lib/i18n";
import { scoreQuestion, tokenize } from "../lib/search";
import { practiceHref, stashCustomSession } from "../lib/sessions";
import { FAVORITES_ID, LIST_COLORS, addManyToList, createList, useStore, type State } from "../lib/store";
import type { Question } from "../lib/types";
import { Icon } from "../components/Icon";
import { RoadSign } from "../components/Illustration";
import QuestionRow from "../components/QuestionRow";
import { Empty, PageTitle, btn } from "../components/ui";

const PAGE = 30;

export type StatusFilter = "all" | "new" | "known" | "wrong" | "fav" | "note";

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "known", label: "Знаю" },
  { id: "wrong", label: "Ошибки" },
  { id: "fav", label: "★ Избранное" },
  { id: "note", label: "С заметкой" },
];

function hasSign(q: Question, id: string) {
  return (q.img?.kind === "sign" && q.img.id === id) || (q.img?.kind === "signs" && q.img.ids.includes(id));
}

function matchesStatus(q: Question, status: StatusFilter, s: State) {
  switch (status) {
    case "all":
      return true;
    case "new":
      return !s.stats[q.id];
    case "known":
      return s.stats[q.id]?.last === "c";
    case "wrong":
      return s.stats[q.id]?.last === "w";
    case "fav":
      return s.lists.some((l) => l.id === FAVORITES_ID && l.qids.includes(q.id));
    case "note":
      return Boolean(s.notes[q.id]);
  }
}

export default function QuestionBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = useStore();
  const { settings } = state;

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [topic, setTopic] = useState(params.get("topic") ?? "");
  const [status, setStatus] = useState<StatusFilter>(
    STATUS.find((x) => x.id === params.get("status"))?.id ?? "all",
  );
  const [list, setList] = useState(params.get("list") ?? "");
  const [allCats, setAllCats] = useState(params.get("cat") === "all");
  const [withImg, setWithImg] = useState(params.get("img") === "1");
  const [sign, setSign] = useState(params.get("sign") ?? "");
  const [showAnswers, setShowAnswers] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  // Keep filters in the URL so a search can be bookmarked or shared.
  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (topic) p.set("topic", topic);
    if (status !== "all") p.set("status", status);
    if (list) p.set("list", list);
    if (allCats) p.set("cat", "all");
    if (withImg) p.set("img", "1");
    if (sign) p.set("sign", sign);
    const next = p.toString();
    if (next !== params.toString()) {
      const t = setTimeout(() => router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false }), 300);
      return () => clearTimeout(t);
    }
  }, [query, topic, status, list, allCats, withImg, sign, params, pathname, router]);

  const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);

  const results = useMemo(() => {
    const cat = allCats ? "all" : settings.cat;
    const exactNo = deferredQuery.trim().match(/^[#№]?\s*(\d{1,4})$/);
    const listQids = list ? new Set(state.lists.find((l) => l.id === list)?.qids ?? []) : null;
    const base = QUESTIONS.filter(
      (q) =>
        appliesToCategory(q, cat) &&
        (!topic || q.topic === topic) &&
        (!listQids || listQids.has(q.id)) &&
        (!withImg || Boolean(q.img)) &&
        (!sign || hasSign(q, sign)) &&
        matchesStatus(q, status, state),
    );
    if (exactNo) {
      const n = Number(exactNo[1]);
      const exact = base.filter((q) => q.no === n || (!q.no && QUESTION_NO[q.id] === n));
      if (exact.length) return exact;
    }
    if (!tokens.length) return base;
    return base
      .map((q) => ({ q, score: scoreQuestion(q, tokens, state.notes[q.id]) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.q);
  }, [allCats, settings.cat, deferredQuery, tokens, topic, list, withImg, sign, status, state]);

  const shown = results.slice(0, limit);
  const filtersActive = Boolean(query || topic || status !== "all" || list || allCats || withImg || sign);

  const reset = () => {
    setQuery("");
    setTopic("");
    setStatus("all");
    setList("");
    setAllCats(false);
    setWithImg(false);
    setSign("");
    setLimit(PAGE);
  };

  const train = () => {
    stashCustomSession(query ? `Поиск: «${query}»` : "Подборка из поиска", results.map((q) => q.id));
    router.push(practiceHref("custom"));
  };

  const saveAll = () => {
    const name = query ? `Поиск: ${query}` : topic ? tr(TOPIC_BY_ID[topic]?.name, "ru") : "Подборка";
    const id = createList(name, LIST_COLORS[(state.lists.length % (LIST_COLORS.length - 1)) + 1]);
    addManyToList(id, results.map((q) => q.id));
    setBulkMsg(`Создан список «${name}» — ${results.length} ${plural(results.length, "вопрос", "вопроса", "вопросов")}`);
  };

  return (
    <div>
      <PageTitle
        title="Вопросы"
        subtitle="Поиск по тексту вопросов, ответов, пояснений и ваших заметок — на русском и румынском, без учёта регистра и диакритики."
      />

      <div className="mr-card z-20 mb-4 space-y-3 p-3 sm:p-4 lg:sticky lg:top-16">
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mr-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Например: обгон, pietoni, 112, №15…"
            className="w-full rounded-xl border border-mr-line bg-mr-bg py-2.5 pl-10 pr-3 text-[15px]"
            aria-label="Поиск по вопросам"
            autoComplete="off"
          />
        </div>
        <div className="mr-scroll-x -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {STATUS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setStatus(s.id);
                setLimit(PAGE);
              }}
              aria-pressed={status === s.id}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                status === s.id ? "border-mr-accent bg-mr-accent-soft font-medium text-mr-accent" : "border-mr-line text-mr-muted hover:text-mr-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setLimit(PAGE);
            }}
            className="col-span-2 rounded-lg border border-mr-line bg-mr-bg px-2 py-1.5 text-sm sm:col-span-1"
            aria-label="Тема"
          >
            <option value="">Все темы</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {tr(t.name, settings.lang)}
              </option>
            ))}
          </select>
          <select
            value={list}
            onChange={(e) => {
              setList(e.target.value);
              setLimit(PAGE);
            }}
            className="rounded-lg border border-mr-line bg-mr-bg px-2 py-1.5 text-sm"
            aria-label="Список"
          >
            <option value="">Все списки</option>
            {state.lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.qids.length})
              </option>
            ))}
          </select>
          <select
            value={allCats ? "all" : "cat"}
            onChange={(e) => setAllCats(e.target.value === "all")}
            className="rounded-lg border border-mr-line bg-mr-bg px-2 py-1.5 text-sm"
            aria-label="Категория"
          >
            <option value="cat">Категория {settings.cat}</option>
            <option value="all">Все категории</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-mr-muted">
            <input type="checkbox" checked={withImg} onChange={(e) => setWithImg(e.target.checked)} className="accent-[var(--mr-accent)]" />
            С картинкой
          </label>
          {sign && SIGN_BY_ID[sign] && (
            <button
              type="button"
              onClick={() => setSign("")}
              className="flex items-center gap-1.5 rounded-full border border-mr-accent bg-mr-accent-soft py-0.5 pl-1 pr-2 text-sm text-mr-accent"
              aria-label="Убрать фильтр по знаку"
            >
              <RoadSign id={sign} size={22} />
              {tr(SIGN_BY_ID[sign].name, settings.lang)}
              <Icon name="x" size={14} />
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-mr-muted">
            <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="accent-[var(--mr-accent)]" />
            Показывать ответы
          </label>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-mr-muted" aria-live="polite">
          Найдено <b className="text-mr-text">{results.length}</b> {plural(results.length, "вопрос", "вопроса", "вопросов")}
          {filtersActive && (
            <button type="button" onClick={reset} className="ml-2 text-mr-accent hover:underline">
              сбросить
            </button>
          )}
        </p>
        {results.length > 0 && (
          <>
            <button type="button" className={btn.ghost} onClick={saveAll} title="Сохранить все найденные вопросы в новый список">
              <Icon name="folder" size={16} /> В список
            </button>
            <button type="button" className={btn.secondary} onClick={train}>
              <Icon name="play" size={15} /> Тренировать {results.length}
            </button>
          </>
        )}
      </div>
      {bulkMsg && (
        <p className="mb-3 text-sm text-mr-good" role="status">
          {bulkMsg}
        </p>
      )}

      {results.length === 0 ? (
        <Empty icon="search" title="Ничего не найдено" text="Попробуйте другое слово, уберите фильтры или выберите «Все категории»." />
      ) : (
        <div className="space-y-2">
          {shown.map((q) => (
            <QuestionRow key={q.id} q={q} tokens={tokens} showAnswer={showAnswers} />
          ))}
          {results.length > limit && (
            <button type="button" className={`${btn.secondary} w-full`} onClick={() => setLimit((l) => l + PAGE)}>
              Показать ещё ({results.length - limit})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
