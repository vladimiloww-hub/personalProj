import { SIGN_BY_ID } from "../data/signs";
import { tr } from "../lib/i18n";
import type { Illustration as IllustrationSpec, Lang } from "../lib/types";

export function RoadSign({
  id,
  size = 96,
  className = "",
  title,
}: {
  id: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const sign = SIGN_BY_ID[id];
  if (!sign) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? sign.name.ru}
    >
      {sign.art()}
    </svg>
  );
}

export function Illustration({
  img,
  lang,
  compact = false,
}: {
  img: IllustrationSpec;
  lang: Lang;
  compact?: boolean;
}) {
  if (img.kind === "sign" || img.kind === "signs") {
    const ids = img.kind === "sign" ? [img.id] : img.ids;
    return (
      <div className={`flex flex-wrap items-center justify-center ${compact ? "gap-1" : "gap-4 py-2"}`}>
        {ids.map((id) => (
          <RoadSign
            key={id}
            id={id}
            size={compact ? 44 : ids.length > 1 ? 104 : 132}
            title={tr(SIGN_BY_ID[id]?.name, lang)}
          />
        ))}
      </div>
    );
  }
  return (
    // Question-bank pictures are static files of arbitrary size; next/image would need their dimensions.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.src}
      alt={tr(img.alt, lang) || "Иллюстрация к вопросу"}
      loading="lazy"
      className={
        compact
          ? "h-14 w-20 rounded-md object-cover"
          : "mx-auto max-h-[340px] w-full rounded-xl object-contain"
      }
    />
  );
}
