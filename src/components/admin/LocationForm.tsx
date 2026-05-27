'use client'

import { useRef, useState } from 'react'
import { OrnateButton } from '@/components/ui/OrnateButton'
import type { Location } from '@/types/quest'

interface LocationFormProps {
  initial?: Partial<Location>
  onSaved: (location: Location) => void
  onCancel: () => void
}

export function LocationForm({ initial, onSaved, onCancel }: LocationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    taskDescription: initial?.taskDescription ?? '',
    lat: initial?.lat?.toString() ?? '',
    lng: initial?.lng?.toString() ?? '',
    order: initial?.order?.toString() ?? '0',
    referencePhotoUrl: initial?.referencePhotoUrl ?? '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) set('referencePhotoUrl', data.url)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      name: form.name,
      description: form.description,
      taskDescription: form.taskDescription,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      order: parseInt(form.order),
      referencePhotoUrl: form.referencePhotoUrl,
    }

    const url = initial?.id ? `/api/locations/${initial.id}` : '/api/locations'
    const method = initial?.id ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const saved = await res.json()
      onSaved(saved)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save.')
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-[#0f0d0a] border border-[#3d2e1a] text-[#e8dcc8] placeholder-[#3d2e1a] px-3 py-2 font-[family-name:var(--font-cinzel)] text-xs outline-none focus:border-[#c4a35a] transition-colors'

  const labelClass = 'block font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.25em] text-[#8a7a64] uppercase mb-1'

  return (
    <form onSubmit={handleSubmit} className="gothic-card p-5 space-y-4">
      <h3 className="font-[family-name:var(--font-cinzel)] text-sm text-[#e8dcc8] tracking-wide">
        {initial?.id ? 'Edit Location' : 'Add Location'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Task Description</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={form.taskDescription} onChange={(e) => set('taskDescription', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Latitude</label>
          <input className={inputClass} type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Longitude</label>
          <input className={inputClass} type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Order</label>
          <input className={inputClass} type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Reference Photo</label>
          <div className="flex gap-2">
            <input
              className={`${inputClass} flex-1 text-[10px]`}
              value={form.referencePhotoUrl}
              onChange={(e) => set('referencePhotoUrl', e.target.value)}
              placeholder="URL or upload →"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-[#3d2e1a] px-2 text-[#8a7a64] hover:text-[#c4a35a] hover:border-[#c4a35a] transition-colors text-xs"
              disabled={uploading}
            >
              {uploading ? '…' : '↑'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs font-[family-name:var(--font-im-fell)] italic">{error}</p>}

      <div className="flex gap-3">
        <OrnateButton type="button" variant="default" className="flex-1" onClick={onCancel}>
          Cancel
        </OrnateButton>
        <OrnateButton type="submit" variant="primary" className="flex-1" loading={saving}>
          {initial?.id ? 'Update' : 'Create'}
        </OrnateButton>
      </div>
    </form>
  )
}
