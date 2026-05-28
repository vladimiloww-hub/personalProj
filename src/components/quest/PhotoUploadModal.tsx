'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { OrnateButton } from '@/components/ui/OrnateButton'
import type { Submission } from '@/types/quest'

interface Location {
  id: string
  name: string
  lat: number
  lng: number
}

interface PhotoUploadModalProps {
  location: Location
  onClose: () => void
  onSubmitted: (submission: Submission) => void
}

export function PhotoUploadModal({ location, onClose, onSubmitted }: PhotoUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('locationId', location.id)
    formData.append('file', file)

    try {
      const res = await fetch('/api/submissions', { method: 'POST', body: formData })
      if (res.ok) {
        const submission = await res.json()
        onSubmitted(submission)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Try again.')
        setLoading(false)
      }
    } catch {
      setError('Connection failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gothic-card w-full max-w-sm rounded-sm p-5 space-y-4">
        <div className="text-center">
          <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#868174] uppercase">
            Submit Proof
          </p>
          <h3 className="font-[family-name:var(--font-cinzel)] text-sm text-[#aea99b] mt-1">
            {location.name}
          </h3>
        </div>

        {/* Photo area */}
        <div
          className="relative aspect-[4/3] bg-[#191713] border border-dashed border-[#433f37] rounded-sm overflow-hidden cursor-pointer hover:border-[#d4cdbc] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg className="w-10 h-10 text-[#433f37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="18" cy="7" r="1" fill="currentColor" />
              </svg>
              <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-widest text-[#433f37] uppercase">
                Tap to take photo
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {error && (
          <p className="text-center text-red-400 text-xs font-[family-name:var(--font-im-fell)] italic">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <OrnateButton
            variant="default"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </OrnateButton>
          <OrnateButton
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!file}
            loading={loading}
          >
            Submit
          </OrnateButton>
        </div>
      </div>
    </div>
  )
}
