import React from 'react'
import type { CuratedPromoDiscoveryDTO } from '../../../types/curatedPromos'
import { getNiche, NICHE_COLORS } from '../../../lib/constants/nicheMap'
import {
  getActiveStatusPillClasses,
  getCuratedPromoCardMeta,
} from '../../../lib/curated-promo-card-display'

type CuratedPromoCardProps = {
  promo: CuratedPromoDiscoveryDTO
  onOpen: () => void
}

export default function CuratedPromoCard({ promo, onOpen }: CuratedPromoCardProps) {
  const niche = getNiche(promo.brand)
  const nc = NICHE_COLORS[niche]
  const { statusLabel, offerTypeLabel, metaChips } = getCuratedPromoCardMeta(promo)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="relative flex-shrink-0 w-[72vw] max-w-[260px] rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150 snap-start select-none"
    >
      <div className={`h-1 w-full ${nc.activeBg}`} />

      <div className="p-3 pt-2.5">
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${nc.bg} border ${nc.border} ${nc.text}`}
          >
            {promo.brand}
          </span>
          <span
            className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wide ${getActiveStatusPillClasses(promo.activeStatus)}`}
          >
            {statusLabel}
          </span>
          {offerTypeLabel && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {offerTypeLabel}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-3 mb-1">
          {promo.title}
        </p>

        {promo.subtitle && (
          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-2">{promo.subtitle}</p>
        )}

        {metaChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-auto">
            {metaChips.map((chip) => (
              <span
                key={chip}
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-100"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium">Tap card to view promo</p>
        </div>
      </div>
    </div>
  )
}
