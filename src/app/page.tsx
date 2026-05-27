import { Suspense } from 'react'
import { SvgDivider } from '@/components/ui/SvgDivider'
import PasswordGate from './PasswordGate'

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-between px-4 py-10 relative overflow-hidden">
      {/* Background decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, #c4a35a 1px, transparent 1px),
            radial-gradient(circle at 80% 50%, #c4a35a 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top tag */}
      <div className="w-full text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.4em] text-[#8a7a64] uppercase">
          Multimedia Collaborative Project
        </p>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md w-full">
        <div className="mb-2">
          <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.35em] text-[#8a7a64] uppercase">
            About the
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-cinzel-decorative)] leading-none text-[#e8dcc8]">
          <span className="block text-5xl sm:text-6xl font-black tracking-tight">go!go!</span>
          <span className="block text-5xl sm:text-6xl font-black tracking-tight text-[#c4a35a]">
            budapest
          </span>
        </h1>

        <div className="mt-2 mb-1">
          <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.35em] text-[#8a7a64] uppercase">
            Quest
          </span>
        </div>

        <SvgDivider className="my-6 w-full max-w-[240px]" />

        <p className="font-[family-name:var(--font-im-fell)] text-[#8a7a64] text-base italic leading-relaxed mb-8 max-w-xs">
          Traverse the ancient streets. Discover hidden places. Prove thy passage.
        </p>

        <Suspense fallback={null}>
          <PasswordGate />
        </Suspense>
      </div>

      {/* Decorative side panels — visible on wider screens */}
      <div className="hidden sm:block absolute left-0 top-0 h-full w-16 border-r border-[#3d2e1a] opacity-40" />
      <div className="hidden sm:block absolute right-0 top-0 h-full w-16 border-l border-[#3d2e1a] opacity-40" />

      {/* Bottom ornament */}
      <div className="w-full text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#3d2e1a] uppercase">
          Budapest · Anno MMXXVI
        </p>
      </div>
    </main>
  )
}
