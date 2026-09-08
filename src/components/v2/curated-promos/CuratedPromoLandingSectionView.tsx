import React from 'react'

import type { GetCuratedPromosResult } from '../../../lib/server/curatedPromoRepository'
import CuratedPromoDiscoveryWidget from './CuratedPromoDiscoveryWidget'
import CuratedPromoEmptyState from './CuratedPromoEmptyState'

export type CuratedPromoLandingSectionViewProps = {
  result: GetCuratedPromosResult
}

/** Presentational shell — shared by the live server section and fixture tests. */
export function CuratedPromoLandingSectionView({
  result,
}: CuratedPromoLandingSectionViewProps) {
  return (
    <section aria-labelledby="curated-promos-landing-heading">
      <div className="overflow-hidden rounded-xl border border-zinc-200 border-l-[3px] border-l-amber-500 shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-3.5 text-white">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-white/20" aria-hidden />
          <p
            id="curated-promos-landing-heading"
            className="relative text-[10px] font-semibold uppercase tracking-widest text-white/80"
          >
            Curated casino promos
          </p>
          <h2 className="relative mt-0.5 text-base font-bold uppercase tracking-wide">
            Promos we&apos;re tracking now
          </h2>
          <p className="relative mt-0.5 max-w-xl text-[11px] text-white/70">
            Browse curated promos by place and offer type. Availability can change; we show
            source-backed offer details, not live inventory.
          </p>
        </div>

        <div className="min-h-[80px] bg-white px-3 pb-2 pt-3">
          {!result.ok ? (
            <CuratedPromoEmptyState message={result.message} />
          ) : (
            <CuratedPromoDiscoveryWidget
              promos={result.promos}
              showHeader={false}
              chipStripVariant="landing"
            />
          )}
        </div>
      </div>
    </section>
  )
}
