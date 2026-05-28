'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LockIcon, HourglassIcon, CheckIcon } from '@/components/ui/LockIcon'
import { OrnateButton } from '@/components/ui/OrnateButton'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { PhotoUploadModal } from './PhotoUploadModal'
import type { Submission } from '@/types/quest'

interface Location {
  id: string
  name: string
  description: string
  taskDescription: string
  lat: number
  lng: number
  referencePhotoUrl: string
  order: number
}

interface LocationCardProps {
  location: Location
  submission: Submission | null
  onSubmitted: (submission: Submission) => void
}

export function LocationCard({ location, submission, onSubmitted }: LocationCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const status = submission?.status ?? 'NONE'
  const isApproved = status === 'APPROVED'
  const isPending = status === 'PENDING'

  const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`

  return (
    <>
      <article
        className={`gothic-card rounded-sm overflow-hidden flex flex-col card-transition ${
          isApproved ? 'ring-1 ring-[#d4cdbc60]' : ''
        }`}
      >
        {/* Reference photo */}
        <div
          className="relative aspect-[4/3] overflow-hidden cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={location.referencePhotoUrl}
            alt={location.name}
            fill
            className={`object-cover transition-all duration-500 ${
              isApproved ? 'brightness-100' : 'brightness-50 grayscale'
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* State overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {isApproved ? (
              <div className="bg-[#1a3a1a]/80 rounded-full p-3">
                <CheckIcon className="w-8 h-8 text-green-400" />
              </div>
            ) : isPending ? (
              <div className="bg-[#625d50]/80 rounded-full p-3">
                <HourglassIcon className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            ) : (
              <div className="bg-black/60 rounded-full p-3">
                <LockIcon className="w-8 h-8 text-[#d4cdbc]" />
              </div>
            )}
          </div>

          {/* Order badge */}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full border border-[#d4cdbc] bg-[#191713]/80 flex items-center justify-center">
            <span className="font-[family-name:var(--font-cinzel)] text-[10px] text-[#d4cdbc]">
              {String(location.order + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Card content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <h2
              className="font-[family-name:var(--font-new-rocker)] text-sm font-semibold text-[#aea99b] tracking-wide leading-snug"
            >
              {location.name}
            </h2>
            <p className="mt-1 text-[#868174] text-xs font-[family-name:var(--font-im-fell)] italic leading-relaxed">
              {location.description}
            </p>
          </div>

          {/* Task */}
          <div className="border-t border-[#433f37] pt-3">
            <p className="text-[9px] font-[family-name:var(--font-cinzel)] tracking-[0.25em] text-[#d4cdbc] uppercase mb-1">
              The Task
            </p>
            <p className="text-xs text-[#868174] font-[family-name:var(--font-im-fell)] italic">
              {location.taskDescription}
            </p>
          </div>

          {/* Map link */}
          <div className="border-t border-[#433f37] pt-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] font-[family-name:var(--font-cinzel)] tracking-[0.15em] uppercase text-[#d4cdbc] border border-[#d4cdbc40] px-3 py-1.5 rounded-sm hover:border-[#d4cdbc] hover:bg-[#d4cdbc10] transition-all"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Open in Maps
            </a>
          </div>

          {/* Action */}
          <div className="mt-auto pt-2">
            {isApproved ? (
              <div className="text-center py-2">
                <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-widest text-green-400 uppercase">
                  ✦ Completed ✦
                </span>
              </div>
            ) : isPending ? (
              <div className="text-center py-2">
                <span className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-widest text-amber-400 uppercase">
                  Awaiting Review…
                </span>
              </div>
            ) : (
              <OrnateButton
                variant="default"
                className="w-full"
                onClick={() => setModalOpen(true)}
              >
                Submit Proof
              </OrnateButton>
            )}
          </div>
        </div>
      </article>

      {lightboxOpen && (
        <ImageLightbox
          src={location.referencePhotoUrl}
          alt={location.name}
          title={location.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {modalOpen && (
        <PhotoUploadModal
          location={location}
          onClose={() => setModalOpen(false)}
          onSubmitted={(s) => {
            onSubmitted(s)
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}
