"use client";

import { useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ShareIcon } from "../../components/icons";
import { Button, RulesButton, Sheet, StatusLine, useToast } from "../../components/ui";
import {
  LEVEL_NAMES,
  MAX_MISTAKES,
  emojiRows,
  judge,
  replay,
  type ConnGroup,
  type ConnPuzzle,
} from "../../lib/connections";
import { isRecord, persisted } from "../../lib/persist";
import { isStrings } from "../../lib/sanitize";
import { shareOrCopy } from "../../lib/share";

/** Shared by the daily «Связи» and custom packs. */

export interface PlayEntry {
  guesses: string[][];
  /** Set once finished; `onDay` means a daily puzzle was played on its own date. */
  result?: { won: boolean; mistakes: number; onDay: boolean };
}

/** Progress per puzzle: daily ones by date, pack ones by "pack:<id>:<n>". */
export const playStore = persisted<Record<string, PlayEntry>>("games:connections", {}, (raw) => {
  if (!isRecord(raw)) return null;
  const entries: Record<string, PlayEntry> = {};
  for (const [key, entry] of Object.entries(raw)) {
    if (!isRecord(entry) || !Array.isArray(entry.guesses) || !entry.guesses.every(isStrings)) continue;
    const r = entry.result;
    entries[key] = {
      guesses: entry.guesses,
      ...(isRecord(r) && typeof r.won === "boolean" && typeof r.mistakes === "number"
        ? { result: { won: r.won, mistakes: r.mistakes, onDay: r.onDay === true } }
        : {}),
    };
  }
  return entries;
});

export const packKey = (id: string, n: number) => `pack:${id}:${n}`;

export const formatDate = (key: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(`${key}T12:00:00`));

/** GET JSON from our API; the error message comes from the server when it gave one. */
export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Не получилось загрузить");
  return data as T;
}

export function Countdown() {
  const seconds = useSyncExternalStore(
    (cb) => {
      const timer = setInterval(cb, 1000);
      return () => clearInterval(timer);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
  if (!seconds) return null;
  const now = new Date(seconds * 1000);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const left = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-wg-display font-extrabold tabular-nums">
      {p(Math.floor(left / 3600))}:{p(Math.floor((left % 3600) / 60))}:{p(left % 60)}
    </span>
  );
}

export function ConnectionsRules() {
  return (
    <RulesButton title="Связи">
      <p>Найди четыре группы по четыре слова, у которых есть что-то общее.</p>
      <p>Выбери четыре слова и нажми «Проверить». Ошибиться можно {MAX_MISTAKES} раза.</p>
      <p>
        Группы бывают простыми («Ягоды») и коварными («Спряталось число»). Некоторые слова подходят сразу к нескольким
        группам — но правильный ответ один.
      </p>
      <div className="space-y-1.5">
        {LEVEL_NAMES.map((name, level) => (
          <p key={level} className={`wg-l${level} rounded-lg px-3 py-1.5 text-sm font-semibold`}>
            {level === 0 ? "Жёлтая — самая простая" : level === 3 ? "Фиолетовая — самая хитрая" : `${name[0].toUpperCase()}${name.slice(1)}`}
          </p>
        ))}
      </div>
      <p className="text-wg-muted">
        В полночь — новая головоломка. Пропущенные можно сыграть в архиве, а результатом поделиться с другом.
      </p>
    </RulesButton>
  );
}

export function GroupBar({ group }: { group: ConnGroup }) {
  return (
    <div className={`wg-l${group.level} wg-conn-bar flex min-h-[64px] flex-col items-center justify-center rounded-xl px-3 py-2 text-center`}>
      <p className="text-[13px] font-extrabold uppercase leading-tight tracking-wide">{group.title}</p>
      <p className="mt-0.5 text-[13px] uppercase leading-snug">{group.words.join(", ")}</p>
    </div>
  );
}

const VERDICTS = ["Идеально!", "Блестяще!", "Отлично!", "Уф, получилось!"];

export interface BoardProps {
  puzzle: ConnPuzzle;
  storageKey: string;
  /** A daily puzzle played on its own date: counts toward the streak. */
  onDay?: boolean;
  /** The line above the grid (number, date, archive link…). */
  header: ReactNode;
  /** Second button once the puzzle is over, next to "Итоги". */
  next: { label: string; onClick: () => void };
  /** First line of the shared result, e.g. "Связи №12". */
  shareTitle: string;
  shareUrl: string;
  subtitle: string;
  /** Below the shared result: stats and countdown, or what to play next. */
  resultFooter?: ReactNode;
}

export function Board({ puzzle, storageKey, onDay = false, header, next, shareTitle, shareUrl, subtitle, resultFooter }: BoardProps) {
  const entries = playStore.use();
  const entry = entries[storageKey] ?? { guesses: [] };
  const progress = replay(puzzle, entry.guesses);
  const { over, solved } = progress;

  const [arrangement, setArrangement] = useState(puzzle.order);
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState(0);
  const [resultOpen, setResultOpen] = useState(progress.over);
  const [note, setNote] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const found = new Set(solved.flatMap((g) => g.words));
  const remaining = over ? [] : arrangement.filter((w) => !found.has(w));
  const bars = over ? [...solved, ...puzzle.groups.filter((g) => !solved.includes(g))] : solved;

  const toggle = (word: string) => {
    if (over) return;
    setSelected((s) => (s.includes(word) ? s.filter((w) => w !== word) : s.length < 4 ? [...s, word] : s));
  };

  const shuffle = () =>
    setArrangement((words) => {
      const list = [...words];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    });

  const submit = () => {
    if (selected.length !== 4 || over) return;
    const outcome = judge(puzzle, progress.counted, selected);
    if (outcome.kind === "repeat") return showToast("Эту четвёрку уже пробовали");

    const guesses = [...entry.guesses, [...selected]];
    const after = replay(puzzle, guesses);
    playStore.set((prev) => ({
      ...prev,
      [storageKey]: { guesses, ...(after.over ? { result: { won: after.won, mistakes: after.mistakes, onDay } } : {}) },
    }));

    if (outcome.kind === "correct") setSelected([]);
    else {
      setShake((n) => n + 1);
      if (outcome.kind === "one-away") showToast("Почти! Одно слово лишнее");
    }
    if (after.over) {
      setSelected([]);
      setTimeout(() => setResultOpen(true), 900);
    }
  };

  const share = async () => {
    const outcome = await shareOrCopy({ title: "Связи", text: `${shareTitle}\n${emojiRows(puzzle, progress.counted)}`, url: shareUrl });
    setNote(outcome === "copied" ? "Скопировано — отправь другу" : outcome === "failed" ? "Не получилось скопировать" : null);
  };

  const left = MAX_MISTAKES - progress.mistakes;

  return (
    <div className="flex flex-col gap-4">
      {header}
      <p className="-mt-2 text-[15px]">Найди четыре группы по четыре слова</p>

      <div className="grid gap-2">
        {bars.map((group) => (
          <GroupBar key={group.level} group={group} />
        ))}
        {remaining.length > 0 && (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Слова">
            {remaining.map((word) => {
              const on = selected.includes(word);
              return (
                <button
                  key={on ? `${word}-${shake}` : word}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(word)}
                  className={`wg-conn-tile ${on ? "is-on" : ""} ${on && shake ? "wg-conn-shake" : ""}`}
                  style={{ "--len": Math.max(word.length, 5) } as CSSProperties}
                >
                  <span>{word}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!over && (
        <p className="flex items-center justify-center gap-2 text-sm text-wg-muted" aria-label={`Можно ошибиться ещё ${left} раз`}>
          Ошибок в запасе:
          {Array.from({ length: MAX_MISTAKES }, (_, i) => (
            <span key={i} className={`size-3 rounded-full ${i < left ? "bg-wg-text" : "bg-wg-line"}`} aria-hidden />
          ))}
        </p>
      )}

      <StatusLine toast={toast} />

      {over ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setResultOpen(true)}>
            Итоги
          </Button>
          <Button onClick={next.onClick}>{next.label}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" className="px-1 text-[13px] sm:text-sm" onClick={shuffle}>
            Перемешать
          </Button>
          <Button
            variant="secondary"
            className="px-1 text-[13px] sm:text-sm"
            onClick={() => setSelected([])}
            disabled={!selected.length}
          >
            Сбросить
          </Button>
          <Button className="px-1 text-[13px] sm:text-sm" onClick={submit} disabled={selected.length !== 4}>
            Проверить
          </Button>
        </div>
      )}

      <Sheet open={over && resultOpen} onClose={() => setResultOpen(false)}>
        <div className="text-center">
          <p className="font-wg-display text-3xl font-extrabold">
            {progress.won ? VERDICTS[progress.mistakes] : "В следующий раз!"}
          </p>
          <p className="mt-1 text-wg-muted">{subtitle}</p>
          <pre className="mt-4 font-sans text-[22px] leading-[1.15]" aria-label="Твои попытки">
            {emojiRows(puzzle, progress.counted)}
          </pre>
          <Button className="mt-4 w-full" onClick={share}>
            <ShareIcon />
            Поделиться результатом
          </Button>
          {note && (
            <p role="status" className="mt-2 text-sm text-wg-muted">
              {note}
            </p>
          )}
          {resultFooter}
        </div>
      </Sheet>
    </div>
  );
}
