import Link from 'next/link'
import { SvgDivider } from '@/components/ui/SvgDivider'

interface GothicHeaderProps {
  subtitle?: string
  showBack?: boolean
}

export function GothicHeader({ subtitle, showBack }: GothicHeaderProps) {
  return (
    <header className="w-full pt-8 pb-4 px-4 text-center">
      {showBack && (
        <Link
          href="/"
          className="absolute top-6 left-4 text-[#8a7a64] hover:text-[#c4a35a] transition-colors text-sm font-[family-name:var(--font-cinzel)] tracking-widest uppercase"
        >
          ← Back
        </Link>
      )}
      <div className="inline-block">
        <p className="text-[#8a7a64] font-[family-name:var(--font-cinzel)] text-xs tracking-[0.3em] uppercase mb-1">
          A Quest Through
        </p>
        <h1 className="font-[family-name:var(--font-cinzel-decorative)] text-3xl sm:text-4xl font-black text-[#e8dcc8] leading-none tracking-tight">
          go!go!
          <span className="text-[#c4a35a]">budapest</span>
        </h1>
        {subtitle && (
          <p className="mt-2 text-[#8a7a64] font-[family-name:var(--font-im-fell)] text-sm italic">
            {subtitle}
          </p>
        )}
      </div>
      <SvgDivider className="mt-6 max-w-sm mx-auto" />
    </header>
  )
}
