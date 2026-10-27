import { cleanName } from "./players";
import { MAX_GUESSES, isLang, isWordShape, normalizeWord, type Lang } from "./words";

/**
 * A word challenge travels in the link itself (after the #, so it never
 * reaches the server): who set it, the word and — when it answers an earlier
 * challenge — how the setter did on the receiver's word. The word is only
 * scrambled so it can't be read at a glance; this is a game, not a secret.
 */
export interface Challenge {
  lang: Lang;
  word: string;
  from: string;
  /** Guesses `from` needed for the receiver's previous word: 1–6, 0 = not found. */
  prev?: number;
}

const KEY = Array.from("go!go!words", (c) => c.charCodeAt(0));

function scramble(bytes: Uint8Array): Uint8Array {
  return bytes.map((b, i) => b ^ KEY[i % KEY.length] ^ (i * 7) % 256);
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeChallenge(c: Challenge): string {
  const payload: Record<string, unknown> = { v: 1, l: c.lang, w: c.word, f: c.from };
  if (c.prev !== undefined) payload.p = c.prev;
  return toBase64Url(scramble(new TextEncoder().encode(JSON.stringify(payload))));
}

export function decodeChallenge(code: string): Challenge | null {
  try {
    const raw = JSON.parse(new TextDecoder().decode(scramble(fromBase64Url(code.trim()))));
    if (raw?.v !== 1 || !isLang(raw.l) || typeof raw.w !== "string") return null;
    const word = normalizeWord(raw.w);
    if (!isWordShape(word, raw.l)) return null;
    const challenge: Challenge = { lang: raw.l, word, from: cleanName(raw.f, "Друг") };
    if (Number.isInteger(raw.p) && raw.p >= 0 && raw.p <= MAX_GUESSES) challenge.prev = raw.p;
    return challenge;
  } catch {
    return null;
  }
}

export const CHALLENGE_PATH = "/games/challenge";

export function challengeUrl(origin: string, c: Challenge): string {
  return `${origin}${CHALLENGE_PATH}#${encodeChallenge(c)}`;
}
