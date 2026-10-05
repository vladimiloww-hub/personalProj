"use client";

import { useEffect, useRef, useState } from "react";
import {
  FAVORITES_ID,
  LIST_COLORS,
  createList,
  isInList,
  setNote,
  toggleInList,
  useStore,
} from "../lib/store";
import { Icon } from "./Icon";

export function StarButton({ qid, withLabel = false }: { qid: string; withLabel?: boolean }) {
  const state = useStore();
  const on = isInList(state, FAVORITES_ID, qid);
  return (
    <button
      type="button"
      onClick={() => toggleInList(FAVORITES_ID, qid)}
      aria-pressed={on}
      aria-label={on ? "Убрать из избранного" : "Добавить в избранное"}
      title={on ? "Убрать из избранного (S)" : "В избранное (S)"}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors ${
        on ? "text-mr-star" : "text-mr-muted hover:bg-mr-surface-2 hover:text-mr-text"
      }`}
    >
      <Icon name="star" size={20} filled={on} />
      {withLabel && <span>{on ? "В избранном" : "В избранное"}</span>}
    </button>
  );
}

/** Popover to put a question into any of the viewer's lists (or a new one). */
export function ListsMenu({ qid }: { qid: string }) {
  const state = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = state.lists.filter((l) => l.id !== FAVORITES_ID && l.qids.includes(qid)).length;

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = LIST_COLORS[(state.lists.length % (LIST_COLORS.length - 1)) + 1];
    const id = createList(trimmed, color);
    toggleInList(id, qid);
    setName("");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Добавить в список"
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors hover:bg-mr-surface-2 ${
          count ? "text-mr-accent" : "text-mr-muted hover:text-mr-text"
        }`}
      >
        <Icon name="folder" size={19} filled={count > 0} />
        <span className="hidden sm:inline">Списки</span>
        {count > 0 && <span className="text-xs">{count}</span>}
      </button>
      {open && (
        <div className="mr-card absolute right-0 z-20 mt-1 w-64 p-2 text-sm sm:left-0 sm:right-auto">
          <p className="px-2 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-mr-muted">
            Сохранить в список
          </p>
          <ul className="max-h-60 overflow-y-auto">
            {state.lists.map((l) => {
              const on = l.qids.includes(qid);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => toggleInList(l.id, qid)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-mr-surface-2"
                    aria-pressed={on}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                      style={{ borderColor: l.color, background: on ? l.color : "transparent" }}
                    >
                      {on && <Icon name="check" size={14} stroke="#fff" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{l.name}</span>
                    <span className="ml-auto text-xs text-mr-muted">{l.qids.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="mt-1 flex gap-1 border-t border-mr-line pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Новый список…"
              maxLength={60}
              className="min-w-0 flex-1 rounded-lg border border-mr-line bg-mr-bg px-2 py-1.5 text-sm"
              aria-label="Название нового списка"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-mr-accent px-2.5 text-mr-accent-ink disabled:opacity-40"
              aria-label="Создать список"
            >
              <Icon name="plus" size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function NoteButton({ active, open, onClick }: { active: boolean; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      title="Заметка к вопросу (N)"
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors hover:bg-mr-surface-2 ${
        active ? "text-mr-accent" : "text-mr-muted hover:text-mr-text"
      }`}
    >
      <Icon name="note" size={19} />
      <span className="hidden sm:inline">Заметка</span>
    </button>
  );
}

/** Personal note on a question; saved as you type (debounced) and on blur. */
export function NoteEditor({ qid, autoFocus = false }: { qid: string; autoFocus?: boolean }) {
  const { notes } = useStore();
  const saved = notes[qid] ?? "";
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const commit = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value !== (notes[qid] ?? "")) {
      setNote(qid, value);
      setStatus("saved");
    }
  };

  return (
    <div className="rounded-xl border border-mr-line bg-mr-surface-2 p-2">
      <textarea
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          setStatus("idle");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => commit(v), 600);
        }}
        onBlur={() => commit(text)}
        onKeyDown={(e) => e.stopPropagation()}
        rows={3}
        placeholder="Ваша заметка: как запомнить, ссылка на пункт правил, почему ошиблись…"
        className="w-full resize-y rounded-lg bg-transparent px-1 text-sm outline-none"
        aria-label="Заметка к вопросу"
      />
      <div className="flex items-center justify-between px-1 text-xs text-mr-muted">
        <span>{status === "saved" ? "Сохранено" : "Заметки ищутся в поиске по вопросам"}</span>
        {text && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setNote(qid, "");
            }}
            className="hover:text-mr-bad"
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}
