"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { QUESTION_BY_ID } from "../lib/bank";
import { plural } from "../lib/i18n";
import { practiceHref, stashCustomSession } from "../lib/sessions";
import {
  FAVORITES_ID,
  LIST_COLORS,
  createList,
  deleteList,
  toggleInList,
  updateList,
  useHydrated,
  useStore,
} from "../lib/store";
import type { Question } from "../lib/types";
import { Icon } from "../components/Icon";
import QuestionRow from "../components/QuestionRow";
import { Empty, PageTitle, btn } from "../components/ui";

const NOTES = "notes";
const MISTAKES = "mistakes";

const toQuestions = (ids: string[]) => ids.map((id) => QUESTION_BY_ID[id]).filter((q): q is Question => Boolean(q));

export default function Saved() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const state = useStore();
  const selected = params.get("list") ?? FAVORITES_ID;
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LIST_COLORS[1]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const select = (id: string) => {
    setEditing(false);
    router.replace(`${pathname}?list=${id}`, { scroll: false });
  };

  const noteIds = useMemo(() => Object.keys(state.notes).filter((id) => QUESTION_BY_ID[id]), [state.notes]);
  const mistakeIds = useMemo(
    () => Object.entries(state.stats).filter(([id, s]) => s.last === "w" && QUESTION_BY_ID[id]).map(([id]) => id),
    [state.stats],
  );

  const userList = state.lists.find((l) => l.id === selected);
  const current =
    selected === NOTES
      ? { id: NOTES, name: "Вопросы с заметками", color: "#64748b", qids: noteIds }
      : selected === MISTAKES
        ? { id: MISTAKES, name: "Ошибки", color: "#c62828", qids: mistakeIds }
        : userList;
  const questions = current ? toQuestions(current.qids) : [];

  const create = () => {
    if (!newName.trim()) return;
    const id = createList(newName, newColor);
    setNewName("");
    select(id);
  };

  const train = () => {
    if (!current) return;
    if (userList) router.push(practiceHref("list", { list: userList.id }));
    else if (selected === MISTAKES) router.push(practiceHref("mistakes"));
    else {
      stashCustomSession(current.name, current.qids);
      router.push(practiceHref("custom"));
    }
  };

  if (!hydrated) return <div className="mr-card h-96 animate-pulse" aria-busy="true" />;

  const sideItem = (id: string, name: string, color: string, count: number, icon?: "star" | "note" | "refresh") => (
    <li key={id}>
      <button
        type="button"
        onClick={() => select(id)}
        aria-current={selected === id ? "true" : undefined}
        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
          selected === id ? "bg-mr-accent-soft font-medium text-mr-accent" : "hover:bg-mr-surface-2"
        }`}
      >
        {icon ? (
          <Icon name={icon} size={17} filled={icon === "star"} style={{ color }} />
        ) : (
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
        )}
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="text-xs tabular-nums text-mr-muted">{count}</span>
      </button>
    </li>
  );

  return (
    <div>
      <PageTitle title="Сохранённые" subtitle="Избранное, ваши списки, заметки и ошибки. Отмечайте вопросы ★ или добавляйте их в списки прямо из карточки вопроса." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <div className="mr-card p-2">
            <ul>
              {state.lists.map((l) =>
                sideItem(l.id, l.name, l.color, l.qids.length, l.id === FAVORITES_ID ? "star" : undefined),
              )}
            </ul>
            <div className="my-2 border-t border-mr-line" />
            <ul>
              {sideItem(NOTES, "С заметками", "#64748b", noteIds.length, "note")}
              {sideItem(MISTAKES, "Ошибки", "#c62828", mistakeIds.length, "refresh")}
            </ul>
          </div>
          <form
            className="mr-card space-y-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <p className="text-sm font-semibold">Новый список</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например: «Знаки приоритета»"
              maxLength={60}
              className="w-full rounded-lg border border-mr-line bg-mr-bg px-3 py-2 text-sm"
              aria-label="Название списка"
            />
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Цвет списка">
              {LIST_COLORS.slice(1).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={newColor === c}
                  aria-label={`Цвет ${c}`}
                  onClick={() => setNewColor(c)}
                  className={`h-6 w-6 rounded-full ${newColor === c ? "ring-2 ring-mr-text ring-offset-2 ring-offset-mr-surface" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button type="submit" disabled={!newName.trim()} className={`${btn.primary} w-full py-2 text-sm`}>
              <Icon name="plus" size={16} /> Создать
            </button>
          </form>
        </aside>

        <section className="min-w-0">
          {!current ? (
            <Empty title="Список не найден" text="Возможно, он был удалён." />
          ) : (
            <>
              <div className="mr-card mb-3 flex flex-wrap items-center gap-2 p-3">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: current.color }} />
                {editing && userList ? (
                  <form
                    className="flex min-w-0 flex-1 gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateList(userList.id, { name: editName });
                      setEditing(false);
                    }}
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={60}
                      className="min-w-0 flex-1 rounded-lg border border-mr-line bg-mr-bg px-2 py-1 text-sm"
                      aria-label="Новое название"
                    />
                    <button type="submit" className={`${btn.primary} px-3 py-1 text-sm`}>
                      Сохранить
                    </button>
                  </form>
                ) : (
                  <h2 className="min-w-0 flex-1 truncate font-semibold">
                    {current.name}{" "}
                    <span className="font-normal text-mr-muted">
                      · {questions.length} {plural(questions.length, "вопрос", "вопроса", "вопросов")}
                    </span>
                  </h2>
                )}
                {userList && !editing && (
                  <>
                    {userList.id !== FAVORITES_ID && (
                      <div className="flex items-center gap-1">
                        {LIST_COLORS.slice(1).map((c) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={`Сменить цвет на ${c}`}
                            onClick={() => updateList(userList.id, { color: c })}
                            className={`hidden h-4 w-4 rounded-full sm:block ${userList.color === c ? "ring-2 ring-mr-text ring-offset-1 ring-offset-mr-surface" : ""}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className={btn.ghost}
                      onClick={() => {
                        setEditName(userList.name);
                        setEditing(true);
                      }}
                      aria-label="Переименовать список"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    {userList.id !== FAVORITES_ID && (
                      <button
                        type="button"
                        className={`${btn.ghost} hover:text-mr-bad`}
                        onClick={() => {
                          if (window.confirm(`Удалить список «${userList.name}»? Вопросы останутся в базе.`)) {
                            deleteList(userList.id);
                            select(FAVORITES_ID);
                          }
                        }}
                        aria-label="Удалить список"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </>
                )}
                {questions.length > 0 && (
                  <>
                    <Link href={`/mreomd/questions?${userList ? `list=${userList.id}` : selected === NOTES ? "status=note" : "status=wrong"}`} className={btn.ghost}>
                      <Icon name="search" size={16} /> Искать
                    </Link>
                    <button type="button" className={`${btn.primary} py-2 text-sm`} onClick={train}>
                      <Icon name="play" size={14} /> Тренировать
                    </button>
                  </>
                )}
              </div>

              {questions.length === 0 ? (
                <Empty
                  icon={selected === NOTES ? "note" : selected === MISTAKES ? "check" : "star"}
                  title={selected === NOTES ? "Заметок пока нет" : selected === MISTAKES ? "Ошибок нет" : "Список пуст"}
                  text={
                    selected === NOTES
                      ? "Нажмите «Заметка» в карточке вопроса, чтобы записать подсказку для себя."
                      : selected === MISTAKES
                        ? "Сюда попадают вопросы, на которые последний ответ был неверным."
                        : "Нажмите ★ или «Списки» в карточке вопроса — в тренировке, на экзамене или в поиске."
                  }
                  action={
                    <Link href="/mreomd/questions" className={btn.secondary}>
                      Перейти к вопросам
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {questions.map((q) => (
                    <QuestionRow
                      key={q.id}
                      q={q}
                      extraAction={
                        userList && userList.id !== FAVORITES_ID ? (
                          <button
                            type="button"
                            onClick={() => toggleInList(userList.id, q.id)}
                            className="inline-flex h-9 items-center rounded-lg px-2 text-mr-muted hover:bg-mr-surface-2 hover:text-mr-bad"
                            aria-label="Убрать из списка"
                            title="Убрать из списка"
                          >
                            <Icon name="x" size={18} />
                          </button>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
