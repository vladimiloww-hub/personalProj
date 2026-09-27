"use client";

import { useEffect, useRef, useState } from "react";

/** Stickers shown after a correct answer. Files live in public/mreomd/right. */
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
];
/** Transparent VP9 WebM: Safari can't render the alpha channel, so these are skipped there. */
const VIDEOS = ["sticker.webm", "sticker2.webm", "sticker3.webm", "sticker4.webm", "stickerYipeeCat.webm"];

const EVENT = "mreo:correct";
const SHOW_MS = 1800;

/** Call after a correct answer to pop a random sticker. */
export function celebrateCorrect() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

function canPlayAlphaWebm() {
  if (typeof document === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari\//.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|Edg)\//.test(ua);
  if (isSafari || /iPhone|iPad|iPod/.test(ua)) return false;
  return document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
}

export default function StickerBurst() {
  const [sticker, setSticker] = useState<{ src: string; video: boolean; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<string | null>(null);

  useEffect(() => {
    const pool = [...IMAGES.map((f) => ({ f, video: false })), ...(canPlayAlphaWebm() ? VIDEOS.map((f) => ({ f, video: true })) : [])];
    const onCorrect = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let pick = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && pick.f === last.current) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
      last.current = pick.f;
      setSticker({ src: `${DIR}/${pick.f}`, video: pick.video, key: Date.now() });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setSticker(null), SHOW_MS);
    };
    window.addEventListener(EVENT, onCorrect);
    return () => {
      window.removeEventListener(EVENT, onCorrect);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!sticker) return null;
  return (
    <div
      key={sticker.key}
      aria-hidden="true"
      className="mr-sticker pointer-events-none fixed bottom-[calc(84px+env(safe-area-inset-bottom))] right-3 z-50 h-32 w-32 sm:h-40 sm:w-40 lg:bottom-8 lg:right-8"
    >
      {sticker.video ? (
        <video src={sticker.src} autoPlay muted playsInline className="h-full w-full object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sticker.src} alt="" className="h-full w-full object-contain" />
      )}
    </div>
  );
}
