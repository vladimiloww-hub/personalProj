import { requireAdminSession } from '@/lib/auth'

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession()

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="border-b border-[#3d2e1a] px-4 py-3 flex items-center justify-between">
        <span className="font-[family-name:var(--font-cinzel)] text-xs tracking-widest text-[#c4a35a] uppercase">
          go!go!budapest · Admin
        </span>
        <a
          href="/"
          className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-widest text-[#8a7a64] hover:text-[#c4a35a] transition-colors uppercase"
        >
          View Site
        </a>
      </nav>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  )
}
