'use client'

import { useState } from 'react'
import Image from 'next/image'
import { OrnateButton } from '@/components/ui/OrnateButton'
import type { SubmissionWithLocation } from '@/types/quest'

export function SubmissionReview({
  initialSubmissions,
}: {
  initialSubmissions: SubmissionWithLocation[]
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(id)
    const res = await fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)))
    }
    setProcessing(null)
  }

  const visible = filter === 'ALL' ? submissions : submissions.filter((s) => s.status === filter)
  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-[#c4a35a] uppercase">
          Submissions
          {pendingCount > 0 && (
            <span className="ml-2 text-amber-400">({pendingCount} pending)</span>
          )}
        </h2>
        <div className="flex gap-1">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest uppercase px-2 py-1 border transition-colors ${
                filter === f
                  ? 'border-[#c4a35a] text-[#c4a35a]'
                  : 'border-[#3d2e1a] text-[#8a7a64] hover:border-[#c4a35a]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="font-[family-name:var(--font-im-fell)] text-[#8a7a64] text-sm italic text-center py-8">
          No submissions to show.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((sub) => (
            <div key={sub.id} className="gothic-card p-4 flex gap-4 items-start">
              {/* Submitted photo */}
              <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-sm border border-[#3d2e1a]">
                <Image
                  src={sub.photoUrl}
                  alt="Submission"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-[family-name:var(--font-cinzel)] text-xs text-[#e8dcc8] truncate">
                  {sub.location.name}
                </p>
                <p className="font-[family-name:var(--font-cinzel)] text-[9px] text-[#8a7a64] tracking-widest">
                  Session: {sub.sessionId.slice(0, 8)}…
                </p>
                <p className="font-[family-name:var(--font-cinzel)] text-[9px] text-[#8a7a64]">
                  {new Date(sub.submittedAt).toLocaleString()}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest uppercase ${
                      sub.status === 'APPROVED'
                        ? 'text-green-400'
                        : sub.status === 'REJECTED'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {sub.status}
                  </span>

                  {sub.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <OrnateButton
                        variant="primary"
                        className="!py-1 !px-3 text-[10px]"
                        loading={processing === sub.id}
                        onClick={() => handleReview(sub.id, 'APPROVED')}
                      >
                        Approve
                      </OrnateButton>
                      <OrnateButton
                        variant="danger"
                        className="!py-1 !px-3 text-[10px]"
                        loading={processing === sub.id}
                        onClick={() => handleReview(sub.id, 'REJECTED')}
                      >
                        Reject
                      </OrnateButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
