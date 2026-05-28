'use client'

import { useEffect } from 'react'

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function ImageLightbox({ src, alt, onClose, title, subtitle, actions }: ImageLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-[#868174] hover:text-[#d4cdbc] transition-colors font-[family-name:var(--font-cinzel)] text-lg leading-none p-2"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      {/* Image + meta — stop propagation so clicking image doesn't close */}
      <div
        className="flex flex-col items-center gap-4 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[75vh] object-contain rounded-sm"
        />

        {(title || subtitle) && (
          <div className="text-center space-y-1">
            {title && (
              <p className="font-[family-name:var(--font-cinzel)] text-sm text-[#aea99b] tracking-wide">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.25em] text-[#868174] uppercase">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {actions && <div>{actions}</div>}
      </div>
    </div>
  )
}
