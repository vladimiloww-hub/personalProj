"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TIKTOK_VIDEOS, shuffleFeed, tiktokPlayerUrl, tiktokVideoUrl, type TikTokVideo } from "../data/tiktok";
import { Icon } from "./Icon";

/** Iframes kept mounted on each side of the visible slide. */
const PRELOAD = 1;
/** TikTok Player API state for "ended" (see onStateChange). */
const STATE_ENDED = 0;

type PlayerCommand = "play" | "pause" | "mute" | "unMute";

function send(frame: HTMLIFrameElement | null | undefined, type: PlayerCommand) {
  frame?.contentWindow?.postMessage({ "x-tiktok-player": true, type }, "https://www.tiktok.com");
}

/**
 * Vertical swipe feed of TikTok Embed Players, sized like a phone screen.
 * Iframes load only once the feed nears the viewport, and only around the visible slide;
 * the slide scrolled away from is paused, and a finished video advances to the next one.
 * Videos come from the chosen creators (data/tiktok.ts), shuffled on every visit.
 */
export default function TikTokFeed() {
  const [videos, setVideos] = useState<TikTokVideo[]>(TIKTOK_VIDEOS);
  const sectionRef = useRef<HTMLElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLDivElement | null)[]>([]);
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  /** Set when the list is reordered under the first slide; scroll snapping would otherwise follow it. */
  const backToTop = useRef(false);

  // Don't touch tiktok.com until the feed is close to the screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        // Shuffle only on the client, before anything is shown, so the server render stays stable.
        backToTop.current = true;
        setVideos((v) => shuffleFeed(v));
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pull the creators' latest videos. Replace the list only if nothing has been watched yet,
  // otherwise append what's new so the current video doesn't jump.
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    fetch("/api/mreomd/tiktok")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { videos?: TikTokVideo[] } | null) => {
        if (cancelled || !data?.videos?.length) return;
        const fresh = shuffleFeed(data.videos);
        setVideos((prev) => {
          if (activeRef.current === 0) {
            backToTop.current = true;
            // Keep the video already on screen in front.
            const first = prev[0];
            return first ? [first, ...fresh.filter((v) => v.id !== first.id)] : fresh;
          }
          const known = new Set(prev.map((v) => v.id));
          const added = fresh.filter((v) => !known.has(v.id));
          return added.length ? [...prev, ...added] : prev;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [near]);

  useLayoutEffect(() => {
    if (!backToTop.current) return;
    backToTop.current = false;
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [videos]);

  // Track which slide is snapped into view.
  useEffect(() => {
    const root = feedRef.current;
    if (!root || !near) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = slides.current.indexOf(e.target as HTMLDivElement);
          if (i >= 0 && i !== activeRef.current) {
            send(frames.current[activeRef.current], "pause");
            activeRef.current = i;
            setActive(i);
          }
        }
      },
      { root, threshold: 0.6 },
    );
    slides.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, [near, videos.length]);

  const scrollTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(videos.length - 1, i));
      slides.current[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [videos.length],
  );

  // Auto-advance when the visible video ends.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.tiktok.com") return;
      const d = e.data as { "x-tiktok-player"?: boolean; type?: string; value?: unknown } | null;
      if (!d || !d["x-tiktok-player"] || d.type !== "onStateChange" || d.value !== STATE_ENDED) return;
      if (e.source !== frames.current[activeRef.current]?.contentWindow) return;
      if (activeRef.current < videos.length - 1) scrollTo(activeRef.current + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [scrollTo, videos.length]);

  // Pause everything when the feed leaves the screen or the tab is hidden.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const pauseAll = () => frames.current.forEach((f) => send(f, "pause"));
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && pauseAll(), { threshold: 0 });
    io.observe(el);
    const onVis = () => document.hidden && pauseAll();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (videos.length === 0) return null;
  const current = videos[active];

  return (
    <section ref={sectionRef} className="mr-noprint mx-auto mt-10 w-full max-w-[420px]" aria-label="Видео из TikTok">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Лента</h2>
          <p className="text-xs text-mr-muted">Листайте вверх и вниз, как в TikTok</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {/* The real For You feed only exists in the TikTok app; this opens it there. */}
          <a
            href="https://www.tiktok.com/foryou"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-mr-text px-3 py-1 text-xs font-medium text-mr-bg"
          >
            Мой TikTok
          </a>
          <span className="text-xs tabular-nums text-mr-muted">
            {active + 1} / {videos.length}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={feedRef}
          className="mr-tiktok-feed h-[min(calc(100dvh-12rem),760px)] min-h-[420px] overflow-y-auto rounded-2xl bg-black"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "PageDown") {
              e.preventDefault();
              scrollTo(active + 1);
            } else if (e.key === "ArrowUp" || e.key === "PageUp") {
              e.preventDefault();
              scrollTo(active - 1);
            }
          }}
        >
          {videos.map((v, i) => (
            <div
              key={v.id}
              ref={(el) => {
                slides.current[i] = el;
              }}
              className="flex h-full w-full snap-start snap-always items-center justify-center"
            >
              {near && Math.abs(i - active) <= PRELOAD ? (
                <iframe
                  ref={(el) => {
                    frames.current[i] = el;
                  }}
                  src={tiktokPlayerUrl(v.id)}
                  title={v.caption ? `TikTok: ${v.caption}` : `TikTok @${v.author}`}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="h-full w-full border-0"
                />
              ) : (
                <span className="text-sm text-white/60">Загрузка…</span>
              )}
            </div>
          ))}
        </div>

        <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
          <FeedButton label="Предыдущее видео" disabled={active === 0} onClick={() => scrollTo(active - 1)}>
            <span className="-rotate-90">
              <Icon name="right" size={18} />
            </span>
          </FeedButton>
          <FeedButton label="Следующее видео" disabled={active === videos.length - 1} onClick={() => scrollTo(active + 1)}>
            <span className="rotate-90">
              <Icon name="right" size={18} />
            </span>
          </FeedButton>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-mr-muted">
        <span className="min-w-0 flex-1 truncate">
          @{current.author}
          {current.caption ? ` · ${current.caption}` : ""}
        </span>
        <a href={tiktokVideoUrl(current)} target="_blank" rel="noopener noreferrer" className="shrink-0 font-medium text-mr-accent">
          Открыть в TikTok
        </a>
      </div>
    </section>
  );
}

function FeedButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur disabled:opacity-30"
    >
      {children}
    </button>
  );
}
