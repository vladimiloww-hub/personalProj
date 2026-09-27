"use client";

import { useState } from "react";
import { tr } from "../lib/i18n";
import { matchSnippet } from "../lib/search";
import { recordAnswer, useStore } from "../lib/store";
import type { Question } from "../lib/types";
import { Icon } from "./Icon";
import { Illustration } from "./Illustration";
import QuestionCard, { Highlight, questionLabel } from "./QuestionCard";
import { StarButton } from "./SaveTools";

/**
 * Compact, expandable question row for search results and saved lists.
 * Expanded, it becomes a full card you can answer right there.
 */
export default function QuestionRow({
  q,
  tokens,
  showAnswer = false,
  extraAction,
}: {
  q: Question;
  tokens?: string[];
  showAnswer?: boolean;
  extraAction?: React.ReactNode;
}) {
  const { settings, stats, notes } = useStore();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const s = stats[q.id];
  const dot = !s ? "bg-mr-line" : s.last === "c" ? "bg-mr-good" : "bg-mr-bad";
  const dotLabel = !s ? "ещё не решали" : s.last === "c" ? "последний ответ верный" : "последний ответ неверный";

  if (open) {
    return (
      <div className="space-y-1">
        <QuestionCard
          q={q}
          lang={settings.lang}
          tokens={tokens}
          selected={picked}
          reveal={picked !== null}
          showCorrect={showAnswer}
          onSelect={
            picked === null && !showAnswer
              ? (a) => {
                  setPicked(a);
                  recordAnswer(q.id, a === q.c);
                }
              : undefined
          }
        />
        <div className="flex justify-end gap-2">
          {picked !== null && (
            <button type="button" className="px-2 py-1 text-sm text-mr-muted hover:text-mr-text" onClick={() => setPicked(null)}>
              Ответить ещё раз
            </button>
          )}
          <button type="button" className="px-2 py-1 text-sm text-mr-accent" onClick={() => setOpen(false)}>
            Свернуть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-card flex items-start gap-3 p-3 transition-colors hover:border-mr-accent/50">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
        aria-label={`Открыть вопрос: ${tr(q.q, settings.lang)}`}
      >
        <span className="mt-1.5 flex flex-col items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} title={dotLabel} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 block text-xs text-mr-muted">{questionLabel(q)}</span>
          <span className="block text-[15px] leading-snug">
            <Highlight text={tr(q.q, settings.lang)} tokens={tokens} />
          </span>
          {!showAnswer &&
            (() => {
              const snip = tokens ? matchSnippet(q, tokens, settings.lang, notes[q.id]) : null;
              return snip ? (
                <span className="mt-1 block text-sm text-mr-muted">
                  <span className="mr-1.5 rounded bg-mr-surface-2 px-1.5 py-px text-[11px] font-medium">{snip.label}</span>
                  <Highlight text={snip.text} tokens={tokens} />
                </span>
              ) : null;
            })()}
          {showAnswer && (
            <span className="mt-1.5 flex items-start gap-1.5 text-sm text-mr-good">
              <Icon name="check" size={16} className="mt-0.5 shrink-0" strokeWidth={2.5} />
              <span>
                <Highlight text={tr(q.a[q.c], settings.lang)} tokens={tokens} />
              </span>
            </span>
          )}
        </span>
        {q.img && (
          <span className="hidden shrink-0 sm:block">
            <Illustration img={q.img} lang={settings.lang} compact />
          </span>
        )}
      </button>
      <div className="flex shrink-0 items-center">
        {extraAction}
        <StarButton qid={q.id} />
      </div>
    </div>
  );
}
