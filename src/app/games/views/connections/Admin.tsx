"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Pack } from "@/lib/games/connections/store";
import { Button, GameScreen, Page, Sheet, TopBar } from "../../components/ui";
import {
  GROUP_TITLE_MAX,
  PACK_TITLE_MAX,
  WORD_MAX,
  addDays,
  cleanSpec,
  packToText,
  parsePackJson,
  parsePackText,
  puzzleProblems,
  type PuzzleSpec,
} from "../../lib/connections";
import { plural } from "../../lib/plural";
import { copyText } from "../../lib/share";
import { formatDate } from "./Board";

/** /games/connections/admin: make packs by hand or from a file, and put them into the daily feed. */

interface DayRow {
  date: string;
  packId: string;
  packIndex: number;
  titles: string[];
}
interface Schedule {
  firstOpen: string;
  days: DayRow[];
}

const PUZZLES: [string, string, string] = ["головоломка", "головоломки", "головоломок"];
const LEVEL_LABELS = ["Жёлтая — простая", "Зелёная", "Синяя", "Фиолетовая — самая хитрая"];

async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Сервер не ответил");
  return data as T;
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const blankSpec = (): PuzzleSpec => ({ groups: [0, 1, 2, 3].map(() => ({ title: "", words: ["", "", "", ""] })) });

const TEMPLATE = `# Мой набор

Ягоды: малина, брусника, клюква, черника
Города на Волге: казань, саратов, тверь, ярославль
Римские богини: диана, юнона, минерва, венера
Модели «Лады»: калина, нива, веста, самара
`;

const input =
  "h-11 w-full rounded-xl border border-wg-line bg-wg-surface px-3 text-[15px] outline-none transition focus:border-wg-text";

export default function ConnectionsAdmin({ authed, storeReady }: { authed: boolean; storeReady: boolean }) {
  return (
    <GameScreen>
      <TopBar title="Админка «Связей»" back="/games/connections" />
      {!authed ? <Login /> : !storeReady ? <NoStore /> : <AdminBody />}
    </GameScreen>
  );
}

function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/admin", "POST", { password });
      window.location.reload();
    } catch {
      setError("Неверный пароль");
      setBusy(false);
    }
  };

  return (
    <Page>
      <h2 className="font-wg-display text-2xl font-extrabold">Вход для админа</h2>
      <p className="text-[15px] text-wg-muted">Тот же пароль, что и в основной админке сайта.</p>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          className={input}
        />
        <Button type="submit" disabled={!password || busy}>
          Войти
        </Button>
        {error && (
          <p role="alert" className="text-center text-sm font-semibold">
            {error}
          </p>
        )}
      </form>
    </Page>
  );
}

function NoStore() {
  return (
    <Page>
      <h2 className="font-wg-display text-2xl font-extrabold">Хранилище не настроено</h2>
      <p className="text-[15px] leading-relaxed text-wg-muted">
        Паки хранятся в Supabase. Добавь ключи проекта в переменные окружения и выполни <code>supabase/games.sql</code>{" "}
        в SQL-редакторе Supabase — подробности в README.
      </p>
    </Page>
  );
}

function AdminBody() {
  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const reload = useCallback(
    () =>
      Promise.all([api<{ packs: Pack[] }>("/api/games/connections/packs?all=1"), api<Schedule>("/api/games/connections/schedule")]).then(
        ([p, s]) => {
          setPacks(p.packs);
          setSchedule(s);
          setError(null);
        },
        (err: Error) => setError(err.message),
      ),
    [],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (title: string, puzzles: PuzzleSpec[] = []) => {
    try {
      const { pack } = await api<{ pack: Pack }>("/api/games/connections/packs", "POST", { title, puzzles, listed: false });
      await reload();
      setOpenId(pack.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const open = packs?.find((p) => p.id === openId);

  if (open && schedule) {
    return (
      <PackEditor
        key={open.id}
        pack={open}
        schedule={schedule}
        onBack={() => setOpenId(null)}
        onChanged={reload}
        onDeleted={async () => {
          setOpenId(null);
          await reload();
        }}
      />
    );
  }

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-wg-display text-2xl font-extrabold">Наборы</h2>
        <div className="flex gap-2">
          <Button variant="secondary" className="h-10 px-4 text-sm" onClick={() => setImportOpen(true)}>
            Импорт
          </Button>
          <Button className="h-10 px-4 text-sm" onClick={() => create("Новый набор")}>
            Новый набор
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-wg-surface-2 p-3 text-sm font-semibold">
          {error}
        </p>
      )}
      {!packs ? (
        <p className="py-10 text-center text-wg-muted">Загружаем…</p>
      ) : packs.length === 0 ? (
        <div className="wg-card p-5 text-[15px] leading-relaxed text-wg-muted">
          Пока ни одного набора. Создай пустой и добавляй головоломки по одной, или загрузи готовые из файла — кнопка
          «Импорт».
        </div>
      ) : (
        <div className="grid gap-3">
          {packs.map((p) => {
            const upcoming = schedule?.days.filter((d) => d.packId === p.id && d.date >= schedule.firstOpen).length ?? 0;
            return (
              <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className="wg-card p-4 text-left transition hover:border-wg-muted">
                <p className="font-wg-display text-lg font-extrabold">{p.title}</p>
                <p className="mt-1 text-[13px] text-wg-muted">
                  {p.puzzles.length} {plural(p.puzzles.length, PUZZLES)} · {p.listed ? "в списке наборов" : "только по ссылке"}
                  {upcoming > 0 && ` · ${upcoming} в ежедневной ленте`}
                </p>
              </button>
            );
          })}
        </div>
      )}
      {schedule && packs && <ScheduleList schedule={schedule} packs={packs} onChanged={reload} />}
      <HowTo />
      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Импорт">
        <Importer
          actionLabel={(n, title) => `Создать набор «${title || "Новый набор"}» (${n})`}
          onImport={async (puzzles, title) => {
            setImportOpen(false);
            await create(title || "Новый набор", puzzles);
          }}
        />
      </Sheet>
    </Page>
  );
}

function HowTo() {
  return (
    <details className="wg-card p-4 text-[14px] leading-relaxed text-wg-muted">
      <summary className="cursor-pointer font-semibold text-wg-text">Как это работает</summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>Набор — это свои головоломки. У каждого есть ссылка, по которой в него можно сыграть.</li>
        <li>«Показывать в списке» — набор появится на странице наборов; иначе он доступен только по ссылке.</li>
        <li>
          «В ежедневную ленту» — головоломки набора займут свободные дни, начиная с выбранной даты, вместо встроенных. До
          своего дня они скрыты и в наборе.
        </li>
        <li>Уже открытые дни не меняются: ставить и убирать можно только будущие.</li>
        <li>Файлом можно загрузить .txt (как в шаблоне) или .json, выгруженный отсюда же.</li>
      </ul>
    </details>
  );
}

function ScheduleList({ schedule, packs, onChanged }: { schedule: Schedule; packs: Pack[]; onChanged: () => Promise<unknown> }) {
  const [error, setError] = useState<string | null>(null);
  const upcoming = schedule.days.filter((d) => d.date >= schedule.firstOpen);
  const past = schedule.days.length - upcoming.length;
  const title = (id: string) => packs.find((p) => p.id === id)?.title ?? "удалённый набор";

  const remove = async (date: string) => {
    try {
      await api(`/api/games/connections/schedule?date=${date}`, "DELETE");
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="grid gap-2">
      <h3 className="font-wg-display text-lg font-extrabold">Ежедневная лента</h3>
      <p className="text-sm text-wg-muted">
        {upcoming.length
          ? "Дни, отданные своим головоломкам. Остальные дни — встроенные."
          : "Своих головоломок в ленте нет — каждый день идёт встроенная."}
        {past > 0 && ` Прошло своих дней: ${past}.`}
      </p>
      {error && <p className="text-sm font-semibold">{error}</p>}
      {upcoming.map((d) => (
        <div key={d.date} className="flex items-center gap-3 rounded-xl bg-wg-surface-2 px-3 py-2 text-sm">
          <span className="w-24 shrink-0 font-semibold">{formatDate(d.date)}</span>
          <span className="min-w-0 flex-1 truncate">
            {title(d.packId)} · №{d.packIndex + 1} <span className="text-wg-muted">({d.titles[0]}…)</span>
          </span>
          <button type="button" onClick={() => remove(d.date)} className="shrink-0 text-wg-muted hover:text-wg-text" aria-label="Убрать из ленты">
            ✕
          </button>
        </div>
      ))}
    </section>
  );
}

function PackEditor({
  pack,
  schedule,
  onBack,
  onChanged,
  onDeleted,
}: {
  pack: Pack;
  schedule: Schedule;
  onBack: () => void;
  onChanged: () => Promise<unknown>;
  onDeleted: () => Promise<unknown>;
}) {
  const fields = (p: Pack) => ({ title: p.title, author: p.author, description: p.description, listed: p.listed, puzzles: p.puzzles });
  const [draft, setDraft] = useState(() => fields(pack));
  const [editing, setEditing] = useState<{ index: number | null; spec: PuzzleSpec } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(fields(pack));
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/games/connections/pack/${pack.id}`;
  const planned = schedule.days.filter((d) => d.packId === pack.id);
  const upcoming = new Set(planned.filter((d) => d.date >= schedule.firstOpen).map((d) => d.packIndex));
  const lastDay = schedule.days.at(-1)?.date;
  const [from, setFrom] = useState(lastDay && lastDay >= schedule.firstOpen ? addDays(lastDay, 1) : schedule.firstOpen);
  const toSchedule = pack.puzzles.map((_, i) => i).filter((i) => !upcoming.has(i));

  const run = async (work: () => Promise<string | void>) => {
    setBusy(true);
    setMessage(null);
    try {
      const done = await work();
      if (done) setMessage(done);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      await api(`/api/games/connections/packs/${pack.id}`, "PUT", draft);
      await onChanged();
      return "Сохранено";
    });

  const remove = () => {
    if (!window.confirm(`Удалить набор «${pack.title}»? Его будущие дни в ленте вернутся к встроенным головоломкам.`)) return;
    void run(async () => {
      await api(`/api/games/connections/packs/${pack.id}`, "DELETE");
      await onDeleted();
    });
  };

  const plan = () =>
    run(async () => {
      const { added } = await api<{ added: string[] }>("/api/games/connections/schedule", "POST", {
        packId: pack.id,
        from,
        indices: toSchedule,
      });
      await onChanged();
      return `В ленте: ${formatDate(added[0])} — ${formatDate(added.at(-1)!)}`;
    });

  const move = (i: number, by: number) => {
    const list = [...draft.puzzles];
    const [item] = list.splice(i, 1);
    list.splice(i + by, 0, item);
    set({ puzzles: list });
  };

  return (
    <Page>
      <button type="button" onClick={onBack} className="self-start text-sm font-semibold text-wg-muted hover:text-wg-text">
        ← Все наборы
      </button>

      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-wg-muted">Название</span>
          <input value={draft.title} maxLength={PACK_TITLE_MAX} onChange={(e) => set({ title: e.target.value })} className={input} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-wg-muted">Автор (по желанию)</span>
          <input value={draft.author} maxLength={40} onChange={(e) => set({ author: e.target.value })} className={input} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-wg-muted">Описание (по желанию)</span>
          <textarea
            value={draft.description}
            maxLength={300}
            rows={2}
            onChange={(e) => set({ description: e.target.value })}
            className="w-full rounded-xl border border-wg-line bg-wg-surface px-3 py-2 text-[15px] outline-none focus:border-wg-text"
          />
        </label>
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" checked={draft.listed} onChange={(e) => set({ listed: e.target.checked })} className="size-5 accent-current" />
          Показывать в списке наборов
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-wg-surface-2 p-3 text-sm">
        <span className="w-full truncate font-mono text-[12px] text-wg-muted">{link}</span>
        <Button variant="secondary" className="h-9 px-3 text-sm" onClick={() => void copyText(link).then(() => setMessage("Ссылка скопирована"))}>
          Копировать
        </Button>
        <Link href={`/games/connections/pack/${pack.id}`} target="_blank" className="font-semibold underline-offset-4 hover:underline">
          Открыть
        </Link>
      </div>

      <section className="grid min-w-0 gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-wg-display text-lg font-extrabold">
            {draft.puzzles.length} {plural(draft.puzzles.length, PUZZLES)}
          </h3>
          <div className="flex gap-2">
            <Button variant="secondary" className="h-9 px-3 text-sm" onClick={() => setImportOpen(true)}>
              Импорт
            </Button>
            <Button className="h-9 px-3 text-sm" onClick={() => setEditing({ index: null, spec: blankSpec() })}>
              Добавить
            </Button>
          </div>
        </div>
        {draft.puzzles.map((p, i) => (
          <div key={i} className="wg-card flex items-center gap-3 p-3">
            <span className="w-7 shrink-0 text-center font-wg-display font-extrabold">{i + 1}</span>
            <button type="button" onClick={() => setEditing({ index: i, spec: p })} className="grid min-w-0 flex-1 grid-cols-2 gap-1 text-left sm:grid-cols-4">
              {p.groups.map((g, level) => (
                <span key={level} className={`wg-l${level} truncate rounded-md px-2 py-1 text-[12px] font-semibold`}>
                  {g.title}
                </span>
              ))}
            </button>
            <div className="flex shrink-0 flex-col text-wg-muted">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Выше" className="px-1 disabled:opacity-30">
                ▲
              </button>
              <button
                type="button"
                disabled={i === draft.puzzles.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Ниже"
                className="px-1 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <button
              type="button"
              onClick={() => set({ puzzles: draft.puzzles.filter((_, k) => k !== i) })}
              aria-label="Удалить головоломку"
              className="shrink-0 px-1 text-wg-muted hover:text-wg-text"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <section className="wg-card grid gap-3 p-4">
        <h3 className="font-wg-display text-base font-extrabold">В ежедневную ленту</h3>
        <p className="text-sm leading-relaxed text-wg-muted">
          {upcoming.size > 0 && `Уже в ленте: ${upcoming.size}. `}
          {toSchedule.length
            ? `Поставить ${toSchedule.length} ${plural(toSchedule.length, PUZZLES)} на свободные дни, начиная с даты:`
            : "Все головоломки набора уже в ленте."}
        </p>
        {toSchedule.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              min={schedule.firstOpen}
              onChange={(e) => setFrom(e.target.value)}
              className={`${input} w-auto`}
            />
            <Button className="h-11 px-4 text-sm" onClick={plan} disabled={busy || dirty || from < schedule.firstOpen}>
              Поставить в ленту
            </Button>
          </div>
        )}
        {dirty && toSchedule.length > 0 && <p className="text-[13px] text-wg-muted">Сначала сохрани изменения.</p>}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="h-10 px-4 text-sm" onClick={() => download(`${pack.title}.txt`, packToText(draft.title, draft.puzzles), "text/plain")}>
          Скачать .txt
        </Button>
        <Button
          variant="secondary"
          className="h-10 px-4 text-sm"
          onClick={() => download(`${pack.title}.json`, JSON.stringify({ title: draft.title, puzzles: draft.puzzles }, null, 2), "application/json")}
        >
          Скачать .json
        </Button>
        <Button variant="ghost" className="ml-auto h-10 px-4 text-sm" onClick={remove} disabled={busy}>
          Удалить набор
        </Button>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-wg-line bg-wg-bg/95 px-4 py-3 backdrop-blur">
        <p role="status" className="min-w-0 flex-1 truncate text-sm text-wg-muted">
          {message ?? (dirty ? "Есть несохранённые изменения" : "Всё сохранено")}
        </p>
        {dirty && (
          <Button variant="ghost" className="h-10 px-3 text-sm" onClick={() => setDraft(fields(pack))}>
            Отменить
          </Button>
        )}
        <Button className="h-10 px-5 text-sm" onClick={save} disabled={!dirty || busy || !draft.title.trim()}>
          Сохранить
        </Button>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.index === null ? "Новая головоломка" : `Головоломка ${(editing?.index ?? 0) + 1}`}>
        {editing && (
          <PuzzleEditor
            initial={editing.spec}
            onCancel={() => setEditing(null)}
            onDone={(spec) => {
              const list = [...draft.puzzles];
              if (editing.index === null) list.push(spec);
              else list[editing.index] = spec;
              set({ puzzles: list });
              setEditing(null);
            }}
          />
        )}
      </Sheet>
      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Импорт в набор">
        <Importer
          actionLabel={(n) => `Добавить ${n} ${plural(n, PUZZLES)} в набор`}
          onImport={(puzzles) => {
            set({ puzzles: [...draft.puzzles, ...puzzles] });
            setImportOpen(false);
            setMessage("Добавлено — не забудь сохранить");
          }}
        />
      </Sheet>
    </Page>
  );
}

function PuzzleEditor({ initial, onCancel, onDone }: { initial: PuzzleSpec; onCancel: () => void; onDone: (spec: PuzzleSpec) => void }) {
  const [spec, setSpec] = useState<PuzzleSpec>(() => ({
    groups: initial.groups.map((g) => ({ title: g.title, words: [...g.words, "", "", "", ""].slice(0, 4) })),
  }));
  const clean = cleanSpec(spec);
  const problems = puzzleProblems(clean);
  const touched = spec.groups.some((g) => g.title || g.words.some(Boolean));

  const setGroup = (level: number, patch: Partial<PuzzleSpec["groups"][number]>) =>
    setSpec((s) => ({ groups: s.groups.map((g, i) => (i === level ? { ...g, ...patch } : g)) }));

  // Typing or pasting "a, b, c, d" into a word box spreads the words over the boxes.
  const setWord = (level: number, slot: number, value: string) => {
    const parts = value.split(/[,;]/);
    const words = [...spec.groups[level].words];
    if (parts.length > 1) parts.forEach((w, k) => slot + k < 4 && (words[slot + k] = w.trim()));
    else words[slot] = value;
    setGroup(level, { words });
  };

  return (
    <div className="grid gap-3">
      <p className="-mt-1 text-[13px] text-wg-muted">
        От простой группы к самой хитрой. Можно вставить сразу четыре слова через запятую. Слово — до {WORD_MAX} символов.
      </p>
      {spec.groups.map((g, level) => (
        <div key={level} className={`wg-l${level} grid gap-2 rounded-xl p-3`}>
          <input
            value={g.title}
            maxLength={GROUP_TITLE_MAX}
            onChange={(e) => setGroup(level, { title: e.target.value })}
            placeholder={`${LEVEL_LABELS[level]}: название группы`}
            aria-label={`Название группы ${level + 1}`}
            className="h-10 rounded-lg border border-black/10 bg-white/70 px-3 text-[15px] font-semibold text-[#1c1b18] outline-none placeholder:text-black/40 focus:bg-white"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {g.words.map((w, slot) => (
              <input
                key={slot}
                value={w}
                onChange={(e) => setWord(level, slot, e.target.value)}
                placeholder={`слово ${slot + 1}`}
                aria-label={`Группа ${level + 1}, слово ${slot + 1}`}
                className="h-10 min-w-0 rounded-lg border border-black/10 bg-white/70 px-2 text-[14px] uppercase text-[#1c1b18] outline-none placeholder:normal-case placeholder:text-black/40 focus:bg-white"
              />
            ))}
          </div>
        </div>
      ))}
      {touched && problems.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-wg-muted">
          {problems.slice(0, 6).map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={() => onDone(clean)} disabled={problems.length > 0}>
          Готово
        </Button>
      </div>
    </div>
  );
}

function Importer({
  actionLabel,
  onImport,
}: {
  actionLabel: (count: number, title?: string) => string;
  onImport: (puzzles: PuzzleSpec[], title?: string) => void | Promise<void>;
}) {
  const [text, setText] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const trimmed = text.trim();
  const parsed = !trimmed ? null : trimmed.startsWith("{") || trimmed.startsWith("[") ? parsePackJson(trimmed) : parsePackText(text);

  return (
    <div className="grid gap-3">
      <p className="-mt-1 text-[13px] leading-relaxed text-wg-muted">
        Вставь текст или загрузи файл (.txt или .json). В тексте — четыре строки «Название: слово, слово, слово, слово» на
        головоломку, от простой группы к хитрой, между головоломками пустая строка.{" "}
        <button type="button" className="font-semibold underline" onClick={() => download("svyazi-shablon.txt", TEMPLATE, "text/plain")}>
          Скачать шаблон
        </button>
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={TEMPLATE}
        className="w-full rounded-xl border border-wg-line bg-wg-surface px-3 py-2 font-mono text-[13px] outline-none focus:border-wg-text"
      />
      <div className="flex items-center gap-2">
        <input
          ref={file}
          type="file"
          accept=".txt,.json,text/plain,application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setText(await f.text());
            e.target.value = "";
          }}
        />
        <Button variant="secondary" className="h-10 px-4 text-sm" onClick={() => file.current?.click()}>
          Выбрать файл
        </Button>
        {parsed && (
          <span className="text-sm text-wg-muted">
            Готово к загрузке: {parsed.puzzles.length}
            {parsed.errors.length > 0 && `, с ошибками: ${parsed.errors.length}`}
          </span>
        )}
      </div>
      {parsed && parsed.errors.length > 0 && (
        <ul className="max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-[13px] text-wg-muted">
          {parsed.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      <Button disabled={!parsed?.puzzles.length} onClick={() => parsed && void onImport(parsed.puzzles, parsed.title)}>
        {parsed?.puzzles.length ? actionLabel(parsed.puzzles.length, parsed.title) : "Нечего загружать"}
      </Button>
    </div>
  );
}
