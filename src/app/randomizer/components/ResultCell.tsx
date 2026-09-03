import type { ReactNode } from "react";

export default function ResultCell({
  label,
  number,
  landed,
  borderClassName = "",
  children,
}: {
  label: string;
  number: string;
  landed: boolean;
  borderClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`h-full flex flex-col gap-4 p-5 sm:gap-5 sm:p-7 lg:p-6 border-rnd-line transition-colors duration-500 ${
        landed ? "bg-rnd-foreground/[0.035]" : "bg-transparent"
      } ${borderClassName}`}
    >
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-rnd-muted sm:text-[11px]">
        <span>{label}</span>
        <span>{number}</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}
