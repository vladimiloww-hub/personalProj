export type SizeTier = { max: number; className: string };

/** Picks the first tier whose `max` length still fits the given text. */
export function sizeClassFor(text: string, tiers: SizeTier[]): string {
  const length = text.length;
  for (const tier of tiers) {
    if (length <= tier.max) return tier.className;
  }
  return tiers[tiers.length - 1].className;
}

/** Big bold headline values (Настроение / Название). */
export const HEADLINE_TIERS: SizeTier[] = [
  { max: 6, className: "text-3xl sm:text-4xl" },
  { max: 9, className: "text-2xl sm:text-3xl" },
  { max: 12, className: "text-xl sm:text-2xl" },
  { max: 16, className: "text-lg sm:text-xl" },
  { max: Infinity, className: "text-base sm:text-lg" },
];

/** Niche phrases, usually longer and multi-word. */
export const NICHE_TIERS: SizeTier[] = [
  { max: 14, className: "text-lg sm:text-xl" },
  { max: 22, className: "text-base sm:text-lg" },
  { max: Infinity, className: "text-sm sm:text-base" },
];

/** Color palette label (e.g. "NAVY INK + ROSE POWDER"). */
export const LABEL_TIERS: SizeTier[] = [
  { max: 16, className: "text-sm sm:text-base" },
  { max: 24, className: "text-xs sm:text-sm" },
  { max: Infinity, className: "text-[11px] sm:text-xs" },
];
