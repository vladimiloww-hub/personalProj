import Link from "next/link";

interface GothicHeaderProps {
  subtitle?: string;
  showBack?: boolean;
  participantName?: string;
}

export function GothicHeader({
  subtitle,
  showBack,
  participantName,
}: GothicHeaderProps) {
  return (
    <header className="w-full pt-8 pb-4 px-4 text-center">
      {showBack && (
        <Link
          href="/"
          className="absolute top-6 left-4 text-[#868174] hover:text-[#d4cdbc] transition-colors text-sm font-[family-name:var(--font-cinzel)] tracking-widest uppercase"
        >
          ← Back
        </Link>
      )}
      <div className="inline-block">
        <p className="text-[#868174] font-[family-name:var(--font-cinzel)] text-xs tracking-[0.3em] uppercase mb-1">
          A Quest Through
        </p>
        <h1 className="font-[family-name:var(--font-new-rocker)] text-8xl sm:text-8xl font-black text-[#aea99b] leading-none tracking-tight">
          go!go!
          <span className="text-[#d4cdbc]">budapest</span>
        </h1>
        {participantName && (
          <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.35em] text-[#d4cdbc] uppercase">
            Seeker · {participantName}
          </p>
        )}
        {subtitle && (
          <p className="mt-2 text-[#868174] font-[family-name:var(--font-im-fell)] text-sm italic">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
