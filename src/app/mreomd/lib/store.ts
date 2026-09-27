import { useSyncExternalStore } from "react";
import { normalizeCategory } from "../data/meta";
import type { CategoryCode, Lang } from "./types";

/**
 * Personal study progress for /mreomd, kept in the viewer's localStorage.
 * A tiny external store read through useSyncExternalStore so every page
 * shares one source of truth and other tabs stay in sync.
 */

const STORAGE_KEY = "mreomd:v1";
export const FAVORITES_ID = "fav";

export interface AnswerStat {
  seen: number;
  correct: number;
  wrong: number;
  /** Result of the most recent attempt. */
  last: "c" | "w";
  at: number;
}

export interface SavedList {
  id: string;
  name: string;
  color: string;
  qids: string[];
  createdAt: number;
}

export interface ExamRecord {
  id: string;
  at: number;
  cat: CategoryCode;
  total: number;
  correct: number;
  minCorrect: number;
  durationSec: number;
  passed: boolean;
  timeout: boolean;
  qids: string[];
  wrong: string[];
  /** Chosen answer index per question id (unanswered questions are absent). */
  answers: Record<string, number>;
}

export interface ActiveExam {
  cat: CategoryCode;
  qids: string[];
  /** Chosen answer index per question id. */
  answers: Record<string, number>;
  startedAt: number;
  deadline: number;
}

export interface Settings {
  lang: Lang;
  cat: CategoryCode;
  theme: "system" | "light" | "dark";
  shuffle: boolean;
  autoNext: boolean;
  /** Finish the exam as soon as the error limit is exceeded. */
  strict: boolean;
}

export interface State {
  v: 1;
  settings: Settings;
  stats: Record<string, AnswerStat>;
  lists: SavedList[];
  notes: Record<string, string>;
  exams: ExamRecord[];
  activeExam: ActiveExam | null;
}

export const LIST_COLORS = [
  "#f5b301",
  "#2f6bff",
  "#16a34a",
  "#e11d48",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#64748b",
];

export function createDefaultState(): State {
  return {
    v: 1,
    settings: {
      lang: "ru",
      cat: "AB",
      theme: "system",
      shuffle: false,
      autoNext: false,
      strict: false,
    },
    stats: {},
    lists: [
      {
        id: FAVORITES_ID,
        name: "Избранное",
        color: LIST_COLORS[0],
        qids: [],
        createdAt: 0,
      },
    ],
    notes: {},
    exams: [],
    activeExam: null,
  };
}

const SERVER_STATE = createDefaultState();
let state: State = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Merge untrusted persisted/imported data over defaults, dropping anything malformed. */
export function sanitizeState(raw: unknown): State {
  const base = createDefaultState();
  if (!isRecord(raw)) return base;

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const s = base.settings;
  if (settings.lang === "ru" || settings.lang === "ro") s.lang = settings.lang;
  if (settings.cat !== undefined) s.cat = normalizeCategory(settings.cat);
  if (settings.theme === "light" || settings.theme === "dark" || settings.theme === "system")
    s.theme = settings.theme;
  if (typeof settings.shuffle === "boolean") s.shuffle = settings.shuffle;
  if (typeof settings.autoNext === "boolean") s.autoNext = settings.autoNext;
  if (typeof settings.strict === "boolean") s.strict = settings.strict;

  if (isRecord(raw.stats)) {
    for (const [id, v] of Object.entries(raw.stats)) {
      if (!isRecord(v)) continue;
      const seen = Number(v.seen) || 0;
      if (seen <= 0) continue;
      base.stats[id] = {
        seen,
        correct: Number(v.correct) || 0,
        wrong: Number(v.wrong) || 0,
        last: v.last === "w" ? "w" : "c",
        at: Number(v.at) || 0,
      };
    }
  }

  if (Array.isArray(raw.lists)) {
    const lists: SavedList[] = [];
    for (const l of raw.lists) {
      if (!isRecord(l) || typeof l.id !== "string" || typeof l.name !== "string") continue;
      lists.push({
        id: l.id,
        name: l.name.slice(0, 60),
        color: typeof l.color === "string" ? l.color : LIST_COLORS[1],
        qids: Array.isArray(l.qids) ? [...new Set(l.qids.filter((x): x is string => typeof x === "string"))] : [],
        createdAt: Number(l.createdAt) || 0,
      });
    }
    if (!lists.some((l) => l.id === FAVORITES_ID)) lists.unshift(base.lists[0]);
    base.lists = lists;
  }

  if (isRecord(raw.notes)) {
    for (const [id, v] of Object.entries(raw.notes)) {
      if (typeof v === "string" && v.trim()) base.notes[id] = v.slice(0, 2000);
    }
  }

  if (Array.isArray(raw.exams)) {
    base.exams = raw.exams
      .filter(
        (e): e is ExamRecord =>
          isRecord(e) && typeof e.id === "string" && Array.isArray(e.qids) && Array.isArray(e.wrong),
      )
      .map((e) => ({ ...e, cat: normalizeCategory(e.cat), answers: isRecord(e.answers) ? e.answers : {} }));
  }

  if (
    isRecord(raw.activeExam) &&
    Array.isArray(raw.activeExam.qids) &&
    isRecord(raw.activeExam.answers) &&
    typeof raw.activeExam.deadline === "number"
  ) {
    base.activeExam = { ...(raw.activeExam as unknown as ActiveExam), cat: normalizeCategory(raw.activeExam.cat) };
  }

  return base;
}

function readStorage(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

function writeStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode) — progress simply won't persist.
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStorage();
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = readStorage();
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return SERVER_STATE;
}

export function getState(): State {
  ensureLoaded();
  return state;
}

function update(fn: (draft: State) => State) {
  ensureLoaded();
  state = fn(state);
  writeStorage();
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True once the client snapshot (with the viewer's saved progress) is in use. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// ——— actions ———

export function setSettings(patch: Partial<Settings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function recordAnswer(qid: string, correct: boolean) {
  update((s) => {
    const prev = s.stats[qid];
    const next: AnswerStat = {
      seen: (prev?.seen ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
      last: correct ? "c" : "w",
      at: Date.now(),
    };
    return { ...s, stats: { ...s.stats, [qid]: next } };
  });
}

export function isInList(s: State, listId: string, qid: string) {
  return s.lists.some((l) => l.id === listId && l.qids.includes(qid));
}

export function toggleInList(listId: string, qid: string) {
  update((s) => ({
    ...s,
    lists: s.lists.map((l) =>
      l.id !== listId
        ? l
        : {
            ...l,
            qids: l.qids.includes(qid) ? l.qids.filter((x) => x !== qid) : [...l.qids, qid],
          },
    ),
  }));
}

export function addManyToList(listId: string, qids: string[]) {
  update((s) => ({
    ...s,
    lists: s.lists.map((l) =>
      l.id !== listId ? l : { ...l, qids: [...new Set([...l.qids, ...qids])] },
    ),
  }));
}

export function createList(name: string, color: string): string {
  const id = `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  update((s) => ({
    ...s,
    lists: [
      ...s.lists,
      { id, name: name.trim().slice(0, 60) || "Список", color, qids: [], createdAt: Date.now() },
    ],
  }));
  return id;
}

export function updateList(listId: string, patch: Partial<Pick<SavedList, "name" | "color">>) {
  update((s) => ({
    ...s,
    lists: s.lists.map((l) =>
      l.id === listId
        ? { ...l, ...patch, name: (patch.name ?? l.name).trim().slice(0, 60) || l.name }
        : l,
    ),
  }));
}

export function deleteList(listId: string) {
  if (listId === FAVORITES_ID) return;
  update((s) => ({ ...s, lists: s.lists.filter((l) => l.id !== listId) }));
}

export function setNote(qid: string, text: string) {
  update((s) => {
    const notes = { ...s.notes };
    if (text.trim()) notes[qid] = text.slice(0, 2000);
    else delete notes[qid];
    return { ...s, notes };
  });
}

export function setActiveExam(exam: ActiveExam | null) {
  update((s) => ({ ...s, activeExam: exam }));
}

export function answerActiveExam(qid: string, answer: number) {
  update((s) =>
    s.activeExam
      ? { ...s, activeExam: { ...s.activeExam, answers: { ...s.activeExam.answers, [qid]: answer } } }
      : s,
  );
}

export function addExamRecord(rec: ExamRecord) {
  update((s) => ({ ...s, exams: [rec, ...s.exams].slice(0, 100), activeExam: null }));
}

export function resetProgress() {
  update((s) => ({ ...s, stats: {}, exams: [], activeExam: null }));
}

export function resetAll() {
  update(() => createDefaultState());
}

export function exportState(): string {
  return JSON.stringify({ ...getState(), exportedAt: new Date().toISOString() }, null, 2);
}

export function importState(json: string) {
  const parsed = JSON.parse(json);
  update(() => sanitizeState(parsed));
}
