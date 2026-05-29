'use client'

import { useState } from 'react'
import { LocationForm } from './LocationForm'
import { OrnateButton } from '@/components/ui/OrnateButton'
import type { Location } from '@/types/quest'

export function LocationManager({ initialLocations }: { initialLocations: Location[] }) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const handleSaved = (loc: Location) => {
    setLocations((prev) => {
      const idx = prev.findIndex((l) => l.id === loc.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = loc
        return next
      }
      return [...prev, loc]
    })
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location and all its submissions?')) return
    setDeleting(id)
    await fetch(`/api/locations/${id}`, { method: 'DELETE' })
    setLocations((prev) => prev.filter((l) => l.id !== id))
    setDeleting(null)
  }

  const handleToggleLock = async (loc: Location) => {
    setToggling(loc.id)
    const res = await fetch(`/api/locations/${loc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked: !loc.locked }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLocations((prev) => prev.map((l) => (l.id === loc.id ? updated : l)))
    }
    setToggling(null)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-new-rocker)] text-sm tracking-widest text-[#d4cdbc] uppercase">
          Locations
        </h2>
        <OrnateButton variant="primary" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Add
        </OrnateButton>
      </div>

      {(showForm && !editing) && (
        <LocationForm
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editing && (
        <LocationForm
          initial={editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="space-y-2">
        {locations.length === 0 ? (
          <p className="font-[family-name:var(--font-im-fell)] text-[#868174] text-sm italic text-center py-8">
            No locations yet. Add the first one above.
          </p>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="gothic-card p-3 flex items-center gap-3">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center border border-[#433f37] rounded-full">
                <span className="font-[family-name:var(--font-cinzel)] text-[9px] text-[#d4cdbc]">
                  {String(loc.order + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-[family-name:var(--font-cinzel)] text-xs text-[#aea99b] truncate">{loc.name}</p>
                <p className="font-[family-name:var(--font-im-fell)] text-[10px] text-[#868174] italic">
                  {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                <button
                  onClick={() => handleToggleLock(loc)}
                  disabled={toggling === loc.id}
                  title={loc.locked ? 'Reveal this location' : 'Seal this location'}
                  className={`font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest uppercase transition-colors ${
                    loc.locked
                      ? 'text-amber-600 hover:text-amber-400'
                      : 'text-green-600 hover:text-green-400'
                  }`}
                >
                  {toggling === loc.id ? '…' : loc.locked ? 'Sealed' : 'Shown'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditing(loc) }}
                  className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#868174] hover:text-[#d4cdbc] uppercase transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  disabled={deleting === loc.id}
                  className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#868174] hover:text-red-400 uppercase transition-colors"
                >
                  {deleting === loc.id ? '…' : 'Del'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
