'use client'

import { useState } from 'react'
import { OrnateButton } from '@/components/ui/OrnateButton'

interface QrParticipant {
  id: string
  nickname: string
}

interface QrDisplayProps {
  participants: QrParticipant[]
}

export function QrDisplay({ participants }: QrDisplayProps) {
  const [showQr, setShowQr] = useState(false)
  const [selected, setSelected] = useState<string>('global')

  const qrUrl =
    selected === 'global'
      ? '/api/admin/qr'
      : `/api/admin/participants/${selected}/qr`

  const downloadName =
    selected === 'global'
      ? 'gogo-budapest-qr.png'
      : `${participants.find((p) => p.id === selected)?.nickname ?? selected}-qr.png`

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = downloadName
    a.click()
  }

  return (
    <div className="gothic-card p-5 space-y-4">
      <h2 className="font-[family-name:var(--font-new-rocker)] text-sm tracking-widest text-[#d4cdbc] uppercase">
        Quest QR Code
      </h2>

      {/* Selector */}
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.25em] text-[#868174] uppercase">
          Generate for
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelected('global'); setShowQr(false) }}
            className={`font-[family-name:var(--font-cinzel)] text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
              selected === 'global'
                ? 'border-[#d4cdbc] text-[#d4cdbc]'
                : 'border-[#433f37] text-[#868174] hover:border-[#d4cdbc]'
            }`}
          >
            Global
          </button>
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelected(p.id); setShowQr(false) }}
              className={`font-[family-name:var(--font-cinzel)] text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                selected === p.id
                  ? 'border-[#d4cdbc] text-[#d4cdbc]'
                  : 'border-[#433f37] text-[#868174] hover:border-[#d4cdbc]'
              }`}
            >
              {p.nickname}
            </button>
          ))}
        </div>
        {selected === 'global' && (
          <p className="font-[family-name:var(--font-im-fell)] text-[#868174] text-xs italic">
            Grants access using the shared password — anyone who scans gets an anonymous session.
          </p>
        )}
      </div>

      {/* QR image */}
      {showQr && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={qrUrl}
            src={qrUrl}
            alt="QR Code"
            className="border border-[#433f37] rounded-sm"
            style={{ imageRendering: 'pixelated', width: 200, height: 200 }}
          />
        </div>
      )}

      <div className="flex gap-3">
        <OrnateButton variant="default" className="flex-1" onClick={() => setShowQr(!showQr)}>
          {showQr ? 'Hide QR' : 'Show QR'}
        </OrnateButton>
        <OrnateButton variant="primary" className="flex-1" onClick={handleDownload}>
          Download
        </OrnateButton>
      </div>
    </div>
  )
}
