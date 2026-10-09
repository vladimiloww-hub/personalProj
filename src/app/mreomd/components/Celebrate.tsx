"use client";

import { useEffect, useRef } from "react";

/** Canvas overlay for flying hearts, confetti and fireworks. Mounted once in the Shell. */

type Kind = "hearts" | "confetti" | "fireworks";
const EVENT = "mreo:celebrate";

/** Hearts fly out of the last tap (or the screen centre). */
export function burstHearts(count = 14) {
  fire("hearts", count);
}

/** Exam finished: hearts always; passed adds confetti and fireworks. */
export function celebrateExam(passed: boolean) {
  fire("hearts", passed ? 24 : 16);
  if (passed) {
    fire("confetti", 160);
    fire("fireworks", 7);
  }
}

function fire(kind: Kind, count: number) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind, count } }));
}

const HEART_COLORS = ["#ff4d8d", "#ff6fa8", "#e8336d", "#ff8fb8", "#d63384", "#ff5c5c"];
const CONFETTI_COLORS = ["#ff4d8d", "#ffd23f", "#3bceac", "#6c9dff", "#a463f2", "#ff8c42", "#4ade80"];
const GRAVITY = 0.12;

interface Particle {
  kind: "heart" | "confetti" | "spark" | "rocket";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  life: number;
  max: number;
  /** Rocket: height at which it explodes. */
  burstAt?: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function drawHeart(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(0, 0, -s * 0.5, 0, -s * 0.5, s * 0.3);
  ctx.bezierCurveTo(-s * 0.5, s * 0.6, 0, s * 0.8, 0, s);
  ctx.bezierCurveTo(0, s * 0.8, s * 0.5, s * 0.6, s * 0.5, s * 0.3);
  ctx.bezierCurveTo(s * 0.5, 0, 0, 0, 0, s * 0.3);
  ctx.fill();
}

export default function Celebrate() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let parts: Particle[] = [];
    let raf = 0;
    let tap: { x: number; y: number; at: number } | null = null;
    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w() * dpr;
      canvas.height = h() * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const explode = (x: number, y: number) => {
      const color = pick(CONFETTI_COLORS);
      const n = 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const sp = rand(2.5, 5.5);
        parts.push({
          kind: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          size: rand(1.8, 3), color: Math.random() < 0.25 ? "#fff" : color, rot: 0, vr: 0, life: 0, max: rand(55, 80),
        });
      }
    };

    const spawn = (kind: Kind, count: number) => {
      if (kind === "hearts") {
        const recent = tap && Date.now() - tap.at < 1500;
        const ox = recent ? tap!.x : w() / 2;
        const oy = recent ? tap!.y : h() / 2;
        for (let i = 0; i < count; i++) {
          const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
          const sp = rand(3, 8);
          parts.push({
            kind: "heart", x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
            size: rand(14, 28), color: pick(HEART_COLORS), rot: rand(-0.4, 0.4), vr: rand(-0.05, 0.05), life: 0, max: rand(60, 95),
          });
        }
      } else if (kind === "confetti") {
        for (let i = 0; i < count; i++) {
          const left = i % 2 === 0;
          parts.push({
            kind: "confetti", x: left ? -10 : w() + 10, y: h() * rand(0.55, 0.85),
            vx: (left ? 1 : -1) * rand(4, 11), vy: rand(-13, -6),
            size: rand(6, 11), color: pick(CONFETTI_COLORS), rot: rand(0, Math.PI), vr: rand(-0.3, 0.3), life: 0, max: rand(140, 200),
          });
        }
      } else {
        for (let i = 0; i < count; i++) {
          parts.push({
            kind: "rocket", x: w() * rand(0.15, 0.85), y: h() + 10 + i * 60, vx: rand(-0.6, 0.6), vy: rand(-11, -8.5),
            size: 3, color: "#fff4c2", rot: 0, vr: 0, life: 0, max: 400, burstAt: h() * rand(0.15, 0.4),
          });
        }
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w(), h());
      const next: Particle[] = [];
      for (const p of parts) {
        p.life++;
        if (p.kind === "rocket") {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY * 0.5;
          if (p.y <= p.burstAt! || p.vy >= 0) {
            explode(p.x, p.y);
            continue;
          }
        } else if (p.kind === "confetti") {
          p.vx *= 0.97;
          p.vy = Math.min(p.vy + GRAVITY * 1.4, 3.2);
          p.x += p.vx + Math.sin(p.life / 9) * 0.8;
          p.y += p.vy;
        } else if (p.kind === "spark") {
          p.vx *= 0.97;
          p.vy = p.vy * 0.97 + GRAVITY * 0.6;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.vx *= 0.98;
          p.vy += GRAVITY;
          p.x += p.vx;
          p.y += p.vy;
        }
        p.rot += p.vr;
        if (p.life > p.max || p.y > h() + 40) continue;
        next.push(p);

        const fade = Math.min(1, (p.max - p.life) / 25);
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.kind === "heart") {
          ctx.translate(0, -p.size / 2);
          drawHeart(ctx, p.size * Math.min(1, p.life / 8));
        } else if (p.kind === "confetti") {
          ctx.scale(1, Math.cos(p.life / 6));
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      // Sparks pushed by explode() are appended to `parts` and picked up by this same loop.
      parts = next;
      raf = parts.length ? requestAnimationFrame(tick) : 0;
      if (!raf) ctx.clearRect(0, 0, w(), h());
    };

    const onEvent = (e: Event) => {
      if (reduced) return;
      const d = (e as CustomEvent<{ kind: Kind; count: number }>).detail;
      if (d) spawn(d.kind, d.count);
    };
    const onPointer = (e: PointerEvent) => {
      tap = { x: e.clientX, y: e.clientY, at: Date.now() };
    };

    window.addEventListener(EVENT, onEvent);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" aria-hidden="true" />;
}
