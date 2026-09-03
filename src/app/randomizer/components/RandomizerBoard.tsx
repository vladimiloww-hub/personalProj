"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import SlotReel from "./SlotReel";
import ResultCell from "./ResultCell";
import { MOODS, NAMES, NICHES, PALETTES } from "../lib/data";
import { buildReelSequence, pickIndex } from "../lib/random";
import {
  HEADLINE_TIERS,
  LABEL_TIERS,
  NICHE_TIERS,
  sizeClassFor,
} from "../lib/textFit";

const FILLER_COUNT = 16;
const NICHE_ITEM_HEIGHT = 80;
const HEADLINE_ITEM_HEIGHT = 96;
const COLOR_ITEM_HEIGHT = 148;

const REELS = {
  niche: { duration: 1.1, delay: 0 },
  mood: { duration: 1.5, delay: 0.1 },
  name: { duration: 1.9, delay: 0.15 },
  colors: { duration: 2.3, delay: 0.2 },
} as const;

const SPIN_LOCK_MS =
  Math.max(...Object.values(REELS).map((r) => r.duration + r.delay)) * 1000 +
  300;

type ReelKey = keyof typeof REELS;

export default function RandomizerBoard() {
  const [nicheIdx, setNicheIdx] = useState(0);
  const [moodIdx, setMoodIdx] = useState(1);
  const [nameIdx, setNameIdx] = useState(0);
  const [paletteIdx, setPaletteIdx] = useState(0);

  const [sequences, setSequences] = useState({
    niche: [0],
    mood: [1],
    name: [0],
    colors: [0],
  });

  const [spinToken, setSpinToken] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isExporting, setIsExporting] = useState<"png" | "pdf" | null>(null);
  const [landed, setLanded] = useState<Record<ReelKey, boolean>>({
    niche: false,
    mood: false,
    name: false,
    colors: false,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const newNiche = pickIndex(NICHES.length, nicheIdx);
    const newMood = pickIndex(MOODS.length, moodIdx);
    const newName = pickIndex(NAMES.length, nameIdx);
    const newPalette = pickIndex(PALETTES.length, paletteIdx);

    setSequences({
      niche: buildReelSequence(NICHES.length, newNiche, FILLER_COUNT),
      mood: buildReelSequence(MOODS.length, newMood, FILLER_COUNT),
      name: buildReelSequence(NAMES.length, newName, FILLER_COUNT),
      colors: buildReelSequence(PALETTES.length, newPalette, FILLER_COUNT),
    });

    setNicheIdx(newNiche);
    setMoodIdx(newMood);
    setNameIdx(newName);
    setPaletteIdx(newPalette);
    setSpinToken((t) => t + 1);
    setIsSpinning(true);
    setLanded({ niche: false, mood: false, name: false, colors: false });

    (Object.keys(REELS) as ReelKey[]).forEach((key) => {
      const { duration, delay } = REELS[key];
      const stopAt = (duration + delay) * 1000;
      timeoutsRef.current.push(
        setTimeout(() => {
          setLanded((prev) => ({ ...prev, [key]: true }));
          timeoutsRef.current.push(
            setTimeout(() => {
              setLanded((prev) => ({ ...prev, [key]: false }));
            }, 500),
          );
        }, stopAt),
      );
    });

    timeoutsRef.current.push(
      setTimeout(() => setIsSpinning(false), SPIN_LOCK_MS),
    );
  }, [isSpinning, moodIdx, nameIdx, nicheIdx, paletteIdx]);

  const handleExportPng = useCallback(async () => {
    if (!cardRef.current || isSpinning || isExporting) return;
    setIsExporting("png");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#faf9f6",
      });
      const link = document.createElement("a");
      link.download = "brief.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed", err);
    } finally {
      setIsExporting(null);
    }
  }, [isExporting, isSpinning]);

  const handleExportPdf = useCallback(async () => {
    if (!cardRef.current || isSpinning || isExporting) return;
    setIsExporting("pdf");
    try {
      const node = cardRef.current;
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#faf9f6",
      });
      const { jsPDF } = await import("jspdf");
      const rect = node.getBoundingClientRect();
      const orientation = rect.width >= rect.height ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: [rect.width, rect.height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, rect.width, rect.height);
      pdf.save("brief.pdf");
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setIsExporting(null);
    }
  }, [isExporting, isSpinning]);

  return (
    <main className="flex w-full flex-1 flex-col items-center gap-10 px-4 py-12 sm:gap-12 sm:py-20">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <p className="text-[13px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-rnd-foreground/85 sm:text-base">
          Создаю бриф
          <br />с помощью рандома
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="flex w-full max-w-6xl flex-col gap-7 sm:gap-9"
      >
        <div
          ref={cardRef}
          className="w-full border border-rnd-line bg-rnd-background"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCell
              label="Ниша"
              number="01"
              landed={landed.niche}
              borderClassName="border-b sm:border-r lg:border-b-0"
            >
              <SlotReel
                sequence={sequences.niche}
                spinToken={spinToken}
                itemHeight={NICHE_ITEM_HEIGHT}
                duration={REELS.niche.duration}
                delay={REELS.niche.delay}
                renderItem={(idx: number, isFinal) => (
                  <span
                    className={`block w-full min-w-0 break-words font-rnd-display font-bold uppercase leading-snug transition-opacity ${sizeClassFor(
                      NICHES[idx],
                      NICHE_TIERS,
                    )} ${
                      isFinal
                        ? "text-rnd-foreground"
                        : "text-rnd-foreground/25 blur-[0.5px]"
                    }`}
                  >
                    {NICHES[idx]}
                  </span>
                )}
              />
            </ResultCell>

            <ResultCell
              label="Настроение"
              number="02"
              landed={landed.mood}
              borderClassName="border-b lg:border-b-0 lg:border-r"
            >
              <SlotReel
                sequence={sequences.mood}
                spinToken={spinToken}
                itemHeight={HEADLINE_ITEM_HEIGHT}
                duration={REELS.mood.duration}
                delay={REELS.mood.delay}
                renderItem={(idx: number, isFinal) => (
                  <span
                    className={`block w-full min-w-0 break-words font-rnd-display font-extrabold uppercase leading-tight transition-opacity ${sizeClassFor(
                      MOODS[idx],
                      HEADLINE_TIERS,
                    )} ${
                      isFinal
                        ? "text-rnd-foreground"
                        : "text-rnd-foreground/25 blur-[0.5px]"
                    }`}
                  >
                    {MOODS[idx]}
                  </span>
                )}
              />
            </ResultCell>

            <ResultCell
              label="Название"
              number="03"
              landed={landed.name}
              borderClassName="border-b sm:border-b-0 sm:border-r"
            >
              <SlotReel
                sequence={sequences.name}
                spinToken={spinToken}
                itemHeight={HEADLINE_ITEM_HEIGHT}
                duration={REELS.name.duration}
                delay={REELS.name.delay}
                renderItem={(idx: number, isFinal) => (
                  <span
                    className={`block w-full min-w-0 break-words font-rnd-display font-extrabold uppercase leading-tight transition-opacity ${sizeClassFor(
                      NAMES[idx],
                      HEADLINE_TIERS,
                    )} ${
                      isFinal
                        ? "text-rnd-foreground"
                        : "text-rnd-foreground/25 blur-[0.5px]"
                    }`}
                  >
                    {NAMES[idx]}
                  </span>
                )}
              />
            </ResultCell>

            <ResultCell label="Цвета" number="04" landed={landed.colors}>
              <SlotReel
                sequence={sequences.colors}
                spinToken={spinToken}
                itemHeight={COLOR_ITEM_HEIGHT}
                duration={REELS.colors.duration}
                delay={REELS.colors.delay}
                renderItem={(idx: number, isFinal) => {
                  const palette = PALETTES[idx];
                  return (
                    <div
                      className={`flex w-full min-w-0 flex-col gap-3 transition-opacity ${
                        isFinal ? "opacity-100" : "opacity-30 blur-[0.5px]"
                      }`}
                    >
                      <div className="flex h-12 w-full max-w-[180px] overflow-hidden border border-rnd-line/70 sm:h-14">
                        {palette.swatches.map((s) => (
                          <div
                            key={s.hex}
                            className="flex-1"
                            style={{ backgroundColor: s.hex }}
                          />
                        ))}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className={`block w-full min-w-0 break-words font-rnd-display font-bold uppercase leading-tight ${sizeClassFor(
                            palette.label,
                            LABEL_TIERS,
                          )}`}
                        >
                          {palette.label}
                        </span>
                        <span className="block w-full min-w-0 break-words font-mono text-[10px] uppercase tracking-wide text-rnd-muted">
                          {palette.swatches.map((s) => s.hex).join("   ·   ")}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </ResultCell>
          </div>

          <div className="flex items-center justify-between border-t border-rnd-line px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-rnd-muted sm:px-7">
            <span>Random Brief</span>
            <span>01 – 04</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center rounded-full bg-rnd-foreground px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-rnd-background">
            Вот что выпало:
          </span>

          <motion.button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-lg bg-rnd-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-rnd-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[300px]"
          >
            {isSpinning ? "Крутим…" : "Крутить"}
          </motion.button>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-rnd-muted">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isSpinning || isExporting !== null}
              className="underline-offset-4 transition hover:text-rnd-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting === "png" ? "Экспорт…" : "Скачать PNG"}
            </button>
            <span aria-hidden className="text-rnd-line">
              /
            </span>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isSpinning || isExporting !== null}
              className="underline-offset-4 transition hover:text-rnd-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting === "pdf" ? "Экспорт…" : "Скачать PDF"}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
