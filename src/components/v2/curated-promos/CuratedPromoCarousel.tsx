'use client'

import React, { useRef, useState } from 'react'
import type { CuratedPromoDiscoveryDTO } from '../../../types/curatedPromos'
import CuratedPromoCard from './CuratedPromoCard'

type CuratedPromoCarouselProps = {
  promos: CuratedPromoDiscoveryDTO[]
  onOpenPromo: (promo: CuratedPromoDiscoveryDTO) => void
}

export default function CuratedPromoCarousel({ promos, onOpenPromo }: CuratedPromoCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollToIdx = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[idx] as HTMLElement | undefined
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setActiveIdx(idx)
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    const trackLeft = track.getBoundingClientRect().left
    let nearest = 0
    let minDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      if (child.getAttribute('aria-hidden') === 'true') return
      const dist = Math.abs(child.getBoundingClientRect().left - trackLeft)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    })
    setActiveIdx(nearest)
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-1 px-0.5"
      >
        {promos.map((promo) => (
          <CuratedPromoCard key={promo.promoId} promo={promo} onOpen={() => onOpenPromo(promo)} />
        ))}
        <div className="flex-shrink-0 w-4" aria-hidden />
      </div>

      {promos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous promo"
            onClick={() => scrollToIdx(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-7 h-7 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-slate-500 hover:text-slate-800 disabled:opacity-20 transition-all z-10"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next promo"
            onClick={() => scrollToIdx(Math.min(promos.length - 1, activeIdx + 1))}
            disabled={activeIdx === promos.length - 1}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-7 h-7 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-slate-500 hover:text-slate-800 disabled:opacity-20 transition-all z-10"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
