import type { Question } from "./types";

/**
 * Normalise text for accent-insensitive search in Russian and Romanian:
 * lower-case, strip diacritics (ă â î ș ț, й → и), fold ё → е and the
 * legacy cedilla forms ş/ţ some keyboards still produce.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/й/g, "и")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[«»"„“”'’`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[\s,.;:!?()]+/)
    .filter((t) => t.length > 0);
}

const indexCache = new WeakMap<Question, string>();

function haystack(q: Question): string {
  let h = indexCache.get(q);
  if (h === undefined) {
    h = normalize(
      [
        q.id,
        q.no ? `№${q.no} #${q.no}` : "",
        q.q.ru,
        q.q.ro ?? "",
        ...q.a.flatMap((a) => [a.ru, a.ro ?? ""]),
        q.e?.ru ?? "",
        q.e?.ro ?? "",
        q.ref?.ru ?? "",
        q.ref?.ro ?? "",
      ].join(" \u0001 "),
    );
    indexCache.set(q, h);
  }
  return h;
}

/**
 * Score a question against the query tokens: every token must match somewhere.
 * Matches in the question text weigh more than in answers or explanations.
 * `extra` is searched too (e.g. the viewer's own note on the question).
 */
export function scoreQuestion(q: Question, tokens: string[], extra = ""): number {
  if (tokens.length === 0) return 1;
  const h = haystack(q);
  const head = normalize(`${q.q.ru} ${q.q.ro ?? ""}`);
  const note = extra ? normalize(extra) : "";
  let score = 0;
  for (const t of tokens) {
    const inBody = h.includes(t);
    const inNote = note.includes(t);
    if (!inBody && !inNote) return 0;
    score += head.includes(t) ? 3 : 1;
    if (inNote) score += 2;
  }
  return score;
}

/** Split `text` into plain and highlighted parts for the given tokens. */
export function highlightParts(text: string, tokens: string[]): { t: string; hit: boolean }[] {
  if (tokens.length === 0 || !text) return [{ t: text, hit: false }];
  // Build a normalised copy with a map back to original indices so we can
  // highlight accent-insensitive matches in the original string.
  const map: number[] = [];
  let norm = "";
  for (let i = 0; i < text.length; i++) {
    const n = normalize(text[i]);
    const piece = text[i] === " " ? " " : n;
    for (let k = 0; k < piece.length; k++) {
      norm += piece[k];
      map.push(i);
    }
  }
  const marks = new Array<boolean>(text.length).fill(false);
  for (const t of tokens) {
    let from = 0;
    while (t && from <= norm.length) {
      const at = norm.indexOf(t, from);
      if (at === -1) break;
      for (let k = at; k < at + t.length; k++) marks[map[k]] = true;
      from = at + t.length;
    }
  }
  const parts: { t: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === marks[i]) last.t += text[i];
    else parts.push({ t: text[i], hit: marks[i] });
  }
  return parts;
}

/**
 * When a question matched through a field that is not on screen (the other
 * language, an answer, the explanation, a note), return a short excerpt of
 * that field around the first hit so the viewer sees why it matched.
 */
export function matchSnippet(
  q: Question,
  tokens: string[],
  lang: "ru" | "ro",
  note = "",
): { label: string; text: string } | null {
  if (tokens.length === 0) return null;
  const shown = lang === "ro" ? (q.q.ro || q.q.ru) : q.q.ru;
  if (highlightParts(shown, tokens).some((p) => p.hit)) return null;
  const other = lang === "ro" ? "ru" : "ro";
  const fields: { label: string; text: string | undefined }[] = [
    { label: other.toUpperCase(), text: q.q[other] },
    ...q.a.flatMap((a, i) => [
      { label: `Ответ ${i + 1}`, text: a[lang] || a.ru },
      { label: `Ответ ${i + 1} (${other.toUpperCase()})`, text: a[other] },
    ]),
    { label: "Пояснение", text: q.e?.[lang] || q.e?.ru },
    { label: `Пояснение (${other.toUpperCase()})`, text: q.e?.[other] },
    { label: "Заметка", text: note },
  ];
  for (const f of fields) {
    if (!f.text) continue;
    const parts = highlightParts(f.text, tokens);
    const idx = parts.findIndex((p) => p.hit);
    if (idx === -1) continue;
    const before = parts.slice(0, idx).map((p) => p.t).join("");
    const start = Math.max(0, before.length - 50);
    const excerpt = f.text.slice(start, start + 140);
    return { label: f.label, text: `${start > 0 ? "…" : ""}${excerpt}${start + 140 < f.text.length ? "…" : ""}` };
  }
  return null;
}
