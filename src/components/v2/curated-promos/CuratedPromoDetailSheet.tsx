'use client'

import React from 'react'
import type { CuratedPromoDiscoveryDTO } from '../../../types/curatedPromos'
import {
  formatActiveStatus,
  humanizeSourceKind,
} from '../../../lib/curated-promo-display'
import CuratedPromoEvidenceBlock from './CuratedPromoEvidenceBlock'
import CuratedPromoSignalList from './CuratedPromoSignalList'

type CuratedPromoDetailSheetProps = {
  promo: CuratedPromoDiscoveryDTO
  onClose: () => void
}

export default function CuratedPromoDetailSheet({ promo, onClose }: CuratedPromoDetailSheetProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:max-h-[85vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="curated-promo-sheet-title"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-3">
          <div className="flex justify-center pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-slate-300/60" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{promo.brand}</p>
              <h2 id="curated-promo-sheet-title" className="mt-1 text-lg font-bold text-slate-950">
                {promo.title}
              </h2>
              {promo.subtitle && <p className="mt-1 text-sm text-slate-600">{promo.subtitle}</p>}

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {promo.locationLabel && <span>{promo.locationLabel}</span>}
                {promo.marketSlug && <span>{promo.marketSlug.replace(/-/g, ' ')}</span>}
                <span>{humanizeSourceKind(promo.sourceKind)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {formatActiveStatus(promo.activeStatus)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signals</p>
            <div className="mt-2">
              <CuratedPromoSignalList signals={promo.signals} />
            </div>
          </div>

          <CuratedPromoEvidenceBlock evidence={promo.evidence} />

          {(promo.visibleStartDate || promo.visibleEndDate || promo.observedAt) && (
            <div className="text-xs text-slate-500">
              {promo.visibleStartDate && <p>Visible from: {promo.visibleStartDate}</p>}
              {promo.visibleEndDate && <p>Visible until: {promo.visibleEndDate}</p>}
              {promo.observedAt && <p>Last observed: {new Date(promo.observedAt).toLocaleDateString()}</p>}
            </div>
          )}
        </div>

        {promo.sourceUrl && (
          <div className="shrink-0 border-t border-slate-100 px-5 py-4">
            <a
              href={promo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              View source
            </a>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Verify details with the source before booking or claiming.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
