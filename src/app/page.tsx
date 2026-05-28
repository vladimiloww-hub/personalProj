import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SvgDivider } from '@/components/ui/SvgDivider'
import PasswordGate from './PasswordGate'
import { getSession } from '@/lib/session'

export default async function HomePage() {
  const session = await getSession()
  if (session.questUnlocked) {
    redirect('/quest')
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-between px-4 py-10 relative overflow-hidden">
      {/* Background decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, #d4cdbc 1px, transparent 1px),
            radial-gradient(circle at 80% 50%, #d4cdbc 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top tag */}
      <div className="w-full text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.4em] text-[#868174] uppercase">
          Multimedia Collaborative Project
        </p>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md w-full">
        <div className="mb-2">
          <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.35em] text-[#868174] uppercase">
            About the
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-new-rocker)] leading-none text-[#aea99b]">
          <span className="block text-5xl sm:text-6xl font-black tracking-tight">go!go!</span>
          <span className="block text-5xl sm:text-6xl font-black tracking-tight text-[#d4cdbc]">
            budapest
          </span>
        </h1>

        <div className="mt-2 mb-1">
          <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.35em] text-[#868174] uppercase">
            Quest
          </span>
        </div>

        <SvgDivider className="my-6 w-full max-w-[240px]" />

        <p className="font-[family-name:var(--font-im-fell)] text-[#868174] text-base italic leading-relaxed mb-8 max-w-xs">
          Traverse the ancient streets. Discover hidden places. Prove thy passage.
        </p>

        <Suspense fallback={null}>
          <PasswordGate />
        </Suspense>
      </div>

      {/* Decorative side panels — visible on wider screens */}
      <div className="hidden sm:block absolute left-0 top-0 h-full w-16 border-r border-[#433f37] opacity-40" />
      <div className="hidden sm:block absolute right-0 top-0 h-full w-16 border-l border-[#433f37] opacity-40" />

      {/* Bottom ornament */}
      <div className="w-full text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#433f37] uppercase">
          Budapest · Anno MMXXVI
        </p>
      </div>
    </main>
  )
}
