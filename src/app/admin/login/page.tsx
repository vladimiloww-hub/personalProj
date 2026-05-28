import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { LoginForm } from './LoginForm'

export default async function AdminLoginPage() {
  const session = await getSession()
  if (session.isAdmin) {
    redirect('/admin')
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="gothic-card w-full max-w-xs p-8 space-y-6">
        <div className="text-center">
          <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.35em] text-[#868174] uppercase">
            go!go!budapest
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-new-rocker)] text-lg text-[#aea99b] tracking-wide">
            Admin Access
          </h1>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}
