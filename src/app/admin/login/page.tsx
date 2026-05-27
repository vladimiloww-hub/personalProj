'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrnateButton } from '@/components/ui/OrnateButton'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Access denied.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="gothic-card w-full max-w-xs p-8 space-y-6">
        <div className="text-center">
          <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.35em] text-[#8a7a64] uppercase">
            go!go!budapest
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-cinzel)] text-lg text-[#e8dcc8] tracking-wide">
            Admin Access
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            required
            className="w-full bg-[#0f0d0a] border border-[#3d2e1a] text-[#e8dcc8] placeholder-[#3d2e1a] px-4 py-3 font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-center outline-none focus:border-[#c4a35a] transition-colors block"
            autoComplete="current-password"
          />

          {error && (
            <p className="text-center text-red-400 text-xs font-[family-name:var(--font-im-fell)] italic">
              {error}
            </p>
          )}

          <OrnateButton variant="primary" className="w-full" loading={loading} type="submit">
            Enter
          </OrnateButton>
        </form>
      </div>
    </main>
  )
}
