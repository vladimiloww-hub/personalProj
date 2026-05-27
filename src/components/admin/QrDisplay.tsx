'use client'

import { useState } from 'react'
import { OrnateButton } from '@/components/ui/OrnateButton'

export function QrDisplay() {
  const [showQr, setShowQr] = useState(false)

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = '/api/admin/qr'
    a.download = 'gogo-budapest-qr.png'
    a.click()
  }

  return (
    <div className="gothic-card p-5 space-y-4">
      <h2 className="font-[family-name:var(--font-cinzel)] text-sm tracking-widest text-[#c4a35a] uppercase">
        Quest QR Code
      </h2>
      <p className="font-[family-name:var(--font-im-fell)] text-[#8a7a64] text-sm italic">
        Share this code to grant access to the quest.
      </p>

      {showQr && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/admin/qr"
            alt="Quest QR Code"
            className="border border-[#3d2e1a] rounded-sm"
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
