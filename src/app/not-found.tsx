import Link from 'next/link'
import { SvgDivider } from '@/components/ui/SvgDivider'

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.4em] text-[#868174] uppercase mb-4">
        Error 404
      </p>
      <h1 className="font-[family-name:var(--font-new-rocker)] text-5xl font-black text-[#aea99b]">
        Lost
      </h1>
      <SvgDivider className="my-6 max-w-[180px]" />
      <p className="font-[family-name:var(--font-im-fell)] text-[#868174] italic text-lg mb-8">
        This path leads nowhere. Return to the quest.
      </p>
      <Link
        href="/"
        className="font-[family-name:var(--font-cinzel)] text-xs tracking-widest text-[#d4cdbc] uppercase border border-[#d4cdbc] px-6 py-3 hover:bg-[#d4cdbc18] transition-colors"
      >
        Return
      </Link>
    </main>
  )
}
