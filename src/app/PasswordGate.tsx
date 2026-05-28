'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OrnateButton } from '@/components/ui/OrnateButton'

export default function PasswordGate() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hasAutoSubmitted = useRef(false)

  const submit = async (pw: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        router.push('/quest')
      } else {
        setError('The seal does not match. Access denied.')
        setLoading(false)
      }
    } catch {
      setError('A dark force disrupted the connection. Try again.')
      setLoading(false)
    }
  }

  const submitToken = async (token: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        router.push('/quest')
      } else {
        setError('This seal is not recognised. The token may be invalid.')
        setLoading(false)
      }
    } catch {
      setError('A dark force disrupted the connection. Try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasAutoSubmitted.current) return
    const token = searchParams.get('token')
    const pw = searchParams.get('password')
    if (token) {
      hasAutoSubmitted.current = true
      submitToken(token)
    } else if (pw) {
      hasAutoSubmitted.current = true
      submit(pw)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full max-w-xs space-y-4">
      {loading ? (
        <div className="text-center py-4">
          <p className="font-[family-name:var(--font-cinzel)] text-xs tracking-widest text-[#868174] uppercase animate-pulse">
            Verifying the seal…
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && password && submit(password)}
              placeholder="Enter access code"
              className="w-full bg-[#2a251a] border border-[#433f37] text-[#aea99b] placeholder-[#433f37] px-4 py-3 font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-center outline-none focus:border-[#d4cdbc] transition-colors"
              style={{ display: 'block' }}
              autoComplete="off"
            />
          </div>

          <OrnateButton
            variant="primary"
            className="w-full"
            onClick={() => password && submit(password)}
            disabled={!password}
          >
            Enter the Quest
          </OrnateButton>

          {error && (
            <p className="text-center text-red-400 text-xs font-[family-name:var(--font-im-fell)] italic">
              {error}
            </p>
          )}

          <p className="text-center text-[#433f37] text-[10px] font-[family-name:var(--font-cinzel)] tracking-widest uppercase">
            or scan the quest seal
          </p>
        </>
      )}
    </div>
  )
}
