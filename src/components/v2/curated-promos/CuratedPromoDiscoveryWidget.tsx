'use client'

import React, { useMemo, useState } from 'react'
import type { CuratedPromoDiscoveryDTO } from '../../../types/curatedPromos'
import {
  EMPTY_CURATED_PROMO_FILTERS,
  type CuratedPromoFilters,
} from '../../../types/curatedPromos'
import {
  buildCuratedPromoFilterOptions,
  filterCuratedPromos,
} from '../../../lib/curated-promo-display'
import CuratedPromoCarousel from './CuratedPromoCarousel'
import CuratedPromoDetailSheet from './CuratedPromoDetailSheet'
import CuratedPromoEmptyState from './CuratedPromoEmptyState'
import CuratedPromoFilterChips from './CuratedPromoFilterChips'

export type CuratedPromoDiscoveryWidgetProps = {
  promos: CuratedPromoDiscoveryDTO[]
  defaultBrand?: string | null
  defaultMarketSlug?: string | null
  title?: string
  subtitle?: string
  /** When false, omit inline title/subtitle (landing section may provide its own header). */
  showHeader?: boolean
  /** `landing` uses the compact homepage chip-strip styling. */
  chipStripVariant?: 'default' | 'landing'
}

export default function CuratedPromoDiscoveryWidget({
  promos,
  defaultBrand = null,
  defaultMarketSlug = null,
  title = 'Curated promos',
  subtitle = 'Filter by place or offer type.',
  showHeader = true,
  chipStripVariant = 'default',
}: CuratedPromoDiscoveryWidgetProps) {
  const [filters, setFilters] = useState<CuratedPromoFilters>({
    ...EMPTY_CURATED_PROMO_FILTERS,
    brand: defaultBrand,
    marketSlug: defaultMarketSlug,
  })
  const [selectedPromo, setSelectedPromo] = useState<CuratedPromoDiscoveryDTO | null>(null)

  const filterOptions = useMemo(
    () => buildCuratedPromoFilterOptions(promos, filters),
    [promos, filters],
  )

  const visiblePromos = useMemo(() => filterCuratedPromos(promos, filters), [promos, filters])

  const handleFilterChange = (next: CuratedPromoFilters) => {
    setFilters(next)
  }

  const handleOpenPromo = (promo: CuratedPromoDiscoveryDTO) => {
    setSelectedPromo(promo)
  }

  const clearFilters = () => setFilters(EMPTY_CURATED_PROMO_FILTERS)

  if (!promos.length) {
    return (
      <CuratedPromoEmptyState message="No curated promos published yet. Check back after the next sync." />
    )
  }

  const filterChips = (
    <CuratedPromoFilterChips
      filters={filters}
      options={filterOptions}
      onFilterChange={handleFilterChange}
      variant={chipStripVariant}
    />
  )

  return (
    <div className="space-y-4">
      {showHeader && (title || subtitle) && (
        <div>
          {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
      )}

      {chipStripVariant === 'landing' ? (
        <div className="relative -mx-3 border-b border-zinc-100">
          <div className="px-4 py-3 backdrop-blur-sm bg-white/70">{filterChips}</div>
        </div>
      ) : (
        filterChips
      )}

      {visiblePromos.length === 0 ? (
        <CuratedPromoEmptyState onClearFilters={clearFilters} />
      ) : (
        <CuratedPromoCarousel promos={visiblePromos} onOpenPromo={handleOpenPromo} />
      )}

      {selectedPromo && (
        <CuratedPromoDetailSheet promo={selectedPromo} onClose={() => setSelectedPromo(null)} />
      )}
    </div>
  )
}
