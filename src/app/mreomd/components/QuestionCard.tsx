"use client";

import { useState, type ReactNode } from "react";
import { TOPIC_BY_ID } from "../data/meta";
import { QUESTION_NO } from "../lib/bank";
import { tr } from "../lib/i18n";
import { highlightParts } from "../lib/search";
import { useStore } from "../lib/store";
import type { Lang, Question } from "../lib/types";
import { Icon } from "./Icon";
import { Illustration } from "./Illustration";
import { ListsMenu, NoteButton, NoteEditor, StarButton } from "./SaveTools";

export function Highlight({ text, tokens }: { text: string; tokens?: string[] }) {
  if (!tokens || tokens.length === 0) return <>{text}</>;
  return (
    <>
      {highlightParts(text, tokens).map((p, i) => (p.hit ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}
    </>
  );
}

export function questionLabel(q: Question) {
  return q.no ? `№ ${q.no}` : `№ ${QUESTION_NO[q.id]}`;
}

export interface QuestionCardProps {
  q: Question;
  lang: Lang;
  /** Display order of answers (indices into q.a). */
  order?: number[];
  /** Chosen answer (index into q.a). */
  selected?: number | null;
  /** Show right/wrong marks and the explanation. */
  reveal?: boolean;
  /** Mark the correct answer without a selection (study mode). */
  showCorrect?: boolean;
  onSelect?: (answer: number) => void;
  heading?: ReactNode;
  tokens?: string[];
  /** Hide the explanation even when revealing (exam review lists keep it collapsed). */
  explanation?: "show" | "hide" | "toggle";
  noteOpen?: boolean;
  onNoteOpenChange?: (open: boolean) => void;
}

export default function QuestionCard({
  q,
  lang,
  order,
  selected = null,
  reveal = false,
  showCorrect = false,
  onSelect,
  heading,
  tokens,
  explanation = "show",
  noteOpen: noteOpenProp,
  onNoteOpenChange,
}: QuestionCardProps) {
  const { notes } = useStore();
  const [noteOpenState, setNoteOpenState] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const noteOpen = noteOpenProp ?? noteOpenState;
  const setNoteOpen = onNoteOpenChange ?? setNoteOpenState;
  const idx = order ?? q.a.map((_, i) => i);
  const answered = selected !== null;
  const topic = TOPIC_BY_ID[q.topic];
  const hasNote = Boolean(notes[q.id]);
  const showExplain = (reveal || showCorrect) && (explanation === "show" || (explanation === "toggle" && explainOpen));

  return (
    <article className="mr-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-mr-line px-4 py-2 text-xs text-mr-muted">
        {heading ?? <span className="font-medium text-mr-text">{questionLabel(q)}</span>}
        {topic && (
          <span className="rounded-full bg-mr-surface-2 px-2 py-0.5">
            {topic.icon} {tr(topic.name, lang)}
          </span>
        )}
        {q.ticket && <span className="rounded-full bg-mr-surface-2 px-2 py-0.5">Билет {q.ticket}</span>}
        <div className="ml-auto flex items-center">
          <StarButton qid={q.id} />
          <ListsMenu qid={q.id} />
          <NoteButton active={hasNote} open={noteOpen} onClick={() => setNoteOpen(!noteOpen)} />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {q.img && <Illustration img={q.img} lang={lang} />}

        <h2 className="text-[17px] font-semibold leading-snug sm:text-lg">
          <Highlight text={tr(q.q, lang)} tokens={tokens} />
        </h2>

        <ol className="space-y-2">
          {idx.map((ai, pos) => {
            const isCorrect = ai === q.c;
            const isSelected = selected === ai;
            let tone = "border-mr-line hover:border-mr-accent/60 hover:bg-mr-surface-2";
            let badge = "bg-mr-surface-2 text-mr-muted";
            if (reveal || showCorrect) {
              if (isCorrect) {
                tone = "border-mr-good bg-mr-good-soft";
                badge = "bg-mr-good text-white";
              } else if (isSelected) {
                tone = "border-mr-bad bg-mr-bad-soft";
                badge = "bg-mr-bad text-white";
              } else {
                tone = "border-mr-line opacity-70";
              }
            } else if (isSelected) {
              tone = "border-mr-accent bg-mr-accent-soft";
              badge = "bg-mr-accent text-mr-accent-ink";
            }
            const interactive = Boolean(onSelect) && !(reveal && answered);
            return (
              <li key={ai}>
                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => onSelect?.(ai)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-[15px] leading-snug transition-colors disabled:cursor-default ${tone}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${badge}`}
                  >
                    {(reveal || showCorrect) && isCorrect ? (
                      <Icon name="check" size={15} strokeWidth={3} />
                    ) : (reveal || showCorrect) && isSelected ? (
                      <Icon name="x" size={15} strokeWidth={3} />
                    ) : (
                      pos + 1
                    )}
                  </span>
                  <span className="flex-1">
                    <Highlight text={tr(q.a[ai], lang)} tokens={tokens} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {(reveal || showCorrect) && explanation === "toggle" && (
          <button
            type="button"
            onClick={() => setExplainOpen((v) => !v)}
            className="text-sm font-medium text-mr-accent"
            aria-expanded={explainOpen}
          >
            {explainOpen ? "Скрыть пояснение" : "Показать пояснение"}
          </button>
        )}

        {showExplain && (
          <div
            className={`rounded-xl border-l-4 px-4 py-3 text-[15px] leading-relaxed ${
              !answered || selected === q.c ? "border-mr-good bg-mr-good-soft" : "border-mr-bad bg-mr-bad-soft"
            }`}
          >
            {answered && (
              <p className={`mb-1 font-semibold ${selected === q.c ? "text-mr-good" : "text-mr-bad"}`}>
                {selected === q.c ? "Верно!" : `Неверно. Правильный ответ — ${idx.indexOf(q.c) + 1}.`}
              </p>
            )}
            {q.e ? (
              <p>
                <Highlight text={tr(q.e, lang)} tokens={tokens} />
              </p>
            ) : (
              !answered && <p>Правильный ответ — {idx.indexOf(q.c) + 1}.</p>
            )}
            {q.ref && <p className="mt-2 text-xs text-mr-muted">Источник: {tr(q.ref, lang)}</p>}
          </div>
        )}

        {noteOpen && <NoteEditor qid={q.id} autoFocus />}
        {!noteOpen && hasNote && (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="block w-full rounded-xl border border-dashed border-mr-line px-3 py-2 text-left text-sm text-mr-muted hover:bg-mr-surface-2"
          >
            <span className="mr-1">📝</span>
            <Highlight text={notes[q.id]} tokens={tokens} />
          </button>
        )}
      </div>
    </article>
  );
}
