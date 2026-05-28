'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrnateButton } from '@/components/ui/OrnateButton'

export function LoginForm() {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        required
        className="w-full bg-[#191713] border border-[#433f37] text-[#aea99b] placeholder-[#433f37] px-4 py-3 font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-center outline-none focus:border-[#d4cdbc] transition-colors block"
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
  )
}
