"use client";

import { useEffect, useRef, useState } from "react";
import { correctMessage, wrongMessage } from "../lib/cute";

/** Stickers shown after an answer. Files live in public/mreomd/right. */
const DIR = "/mreomd/right";
const IMAGES = [
  "sticker.webp",
  "sticker3.webp",
  "sticker4.webp",
  "sticker5.webp",
  "sticker6.webp",
  "sticker7.webp",
  "sticker8.webp",
  "sticker9.webp",
  "sticker10.webp",
  ...Array.from({ length: 15 }, (_, i) => `sticker${i + 11}.webp`),
  "photo1.webp",
  "photo2.webp",
];
/** Transparent VP9 WebM: Safari can't render the alpha channel, so these are skipped there. */
const VIDEOS = ["sticker.webm", "sticker2.webm", "sticker3.webm", "sticker4.webm", "stickerYipeeCat.webm"];

const EVENT = "mreo:answer";
const IMAGE_MS = 2000;
/** Upper bound for video stickers; they normally hide themselves when playback ends. */
const VIDEO_MAX_MS = 3500;

/** Call after a practice answer to pop a random sticker with a message. */
export function celebrateAnswer(ok: boolean) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: { ok } }));
}

function canPlayAlphaWebm() {
  if (typeof document === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari\//.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|Edg)\//.test(ua);
  if (isSafari || /iPhone|iPad|iPod/.test(ua)) return false;
  return document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
}

interface Burst {
  src: string;
  video: boolean;
  ok: boolean;
  text: string;
  key: number;
}

/** Sticker that springs out over the page, like the Yippee cat on the quest cards. */
export default function StickerBurst() {
  const [burst, setBurst] = useState<Burst | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<string | null>(null);

  useEffect(() => {
    const pool = [
      ...IMAGES.map((f) => ({ f, video: false })),
      ...(canPlayAlphaWebm() ? VIDEOS.map((f) => ({ f, video: true })) : []),
    ];
    const onAnswer = (e: Event) => {
      const ok = Boolean((e as CustomEvent<{ ok: boolean }>).detail?.ok);
      let pick = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && pick.f === last.current) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
      last.current = pick.f;
      setBurst({
        src: `${DIR}/${pick.f}`,
        video: pick.video,
        ok,
        text: ok ? correctMessage() : wrongMessage(),
        key: Date.now(),
      });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBurst(null), pick.video ? VIDEO_MAX_MS : IMAGE_MS);
    };
    window.addEventListener(EVENT, onAnswer);
    return () => {
      window.removeEventListener(EVENT, onAnswer);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!burst) return null;
  return (
    <div
      key={burst.key}
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mr-sticker h-44 w-44 drop-shadow-2xl sm:h-52 sm:w-52" aria-hidden="true">
        {burst.video ? (
          <video
            src={burst.src}
            autoPlay
            muted
            playsInline
            onEnded={() => setBurst(null)}
            className="h-full w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={burst.src}
            alt=""
            className={`h-full w-full ${burst.src.includes("/photo") ? "rounded-2xl object-cover" : "object-contain"}`}
          />
        )}
      </div>
      <p
        className={`mr-sticker-text max-w-xs rounded-2xl px-4 py-2 text-center text-base font-bold text-white shadow-xl ${
          burst.ok ? "bg-mr-good" : "bg-[#d63384]"
        }`}
      >
        {burst.text}
      </p>
    </div>
  );
}
