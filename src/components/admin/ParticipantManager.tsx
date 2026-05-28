'use client'

import { useState } from 'react'
import { OrnateButton } from '@/components/ui/OrnateButton'

export interface ParticipantEntry {
  id: string
  nickname: string
  token: string
  createdAt: string
  lastSeenAt: string | null
  submissionCount: number
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ParticipantManager({ initialParticipants }: { initialParticipants: ParticipantEntry[] }) {
  const [participants, setParticipants] = useState<ParticipantEntry[]>(initialParticipants)
  const [newNickname, setNewNickname] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNickname.trim()) return
    setCreating(true)
    const res = await fetch('/api/admin/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: newNickname.trim() }),
    })
    if (res.ok) {
      const created: ParticipantEntry = await res.json()
      setParticipants((prev) => [...prev, created])
      setNewNickname('')
    }
    setCreating(false)
  }

  const handleDelete = async (id: string, nickname: string) => {
    const withSubs = confirm(
      `Delete "${nickname}"?\n\nOK = delete participant + their submissions\nCancel = keep submissions (just remove participant)`
    )
    setDeleting(id)
    await fetch(`/api/admin/participants/${id}?withSubmissions=${withSubs}`, { method: 'DELETE' })
    setParticipants((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  const downloadQr = (id: string, nickname: string) => {
    const a = document.createElement('a')
    a.href = `/api/admin/participants/${id}/qr`
    a.download = `${nickname}-qr.png`
    a.click()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-new-rocker)] text-sm tracking-widest text-[#d4cdbc] uppercase">
          Quest Seekers
        </h2>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newNickname}
          onChange={(e) => setNewNickname(e.target.value)}
          placeholder="Seeker's name…"
          maxLength={40}
          className="flex-1 bg-[#191713] border border-[#433f37] text-[#aea99b] placeholder-[#433f37] px-3 py-2 font-[family-name:var(--font-cinzel)] text-xs tracking-widest outline-none focus:border-[#d4cdbc] transition-colors"
        />
        <OrnateButton type="submit" variant="primary" loading={creating} disabled={!newNickname.trim()}>
          Summon
        </OrnateButton>
      </form>

      {/* Participant list */}
      {participants.length === 0 ? (
        <p className="font-[family-name:var(--font-im-fell)] text-[#868174] text-sm italic text-center py-8">
          No seekers yet. Summon the first one above.
        </p>
      ) : (
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="gothic-card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-[family-name:var(--font-cinzel)] text-xs text-[#d4cdbc] truncate">
                  {p.nickname}
                </p>
                <p className="font-[family-name:var(--font-im-fell)] text-[10px] text-[#868174] italic">
                  {p.submissionCount} {p.submissionCount === 1 ? 'seal' : 'seals'} · last seen {formatLastSeen(p.lastSeenAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => downloadQr(p.id, p.nickname)}
                  className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#868174] hover:text-[#d4cdbc] uppercase transition-colors border border-[#433f37] hover:border-[#d4cdbc] px-2 py-1"
                >
                  QR
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.nickname)}
                  disabled={deleting === p.id}
                  className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#868174] hover:text-red-400 uppercase transition-colors"
                >
                  {deleting === p.id ? '…' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
