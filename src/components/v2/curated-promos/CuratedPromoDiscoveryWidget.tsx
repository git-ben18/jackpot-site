'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { CuratedPromoDiscoveryDTO } from '../../../types/curatedPromos'
import {
  EMPTY_CURATED_PROMO_FILTERS,
  type CuratedPromoFilters,
} from '../../../types/curatedPromos'
import {
  buildCuratedPromoFilterOptions,
  filterCuratedPromos,
} from '../../../lib/curated-promo-display'
import {
  emitApprovedEventFailSoft,
  getDefaultFirstReleaseTelemetry,
  type FirstReleaseTelemetryEmitter,
} from '../../../lib/telemetry/first-release-telemetry-emitter'
import {
  discoveryViewOnceKey,
  emptyStateOnceKey,
  filterClickPayloadFromToggle,
  toTelemetryFilterVocabulary,
} from '../../../lib/telemetry/first-release-telemetry-triggers'
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
  /** Optional S5-F seam; production defaults to the disabled sink. */
  telemetry?: FirstReleaseTelemetryEmitter
}

export default function CuratedPromoDiscoveryWidget({
  promos,
  defaultBrand = null,
  defaultMarketSlug = null,
  title = 'Curated promos',
  subtitle = 'Filter by place or offer type.',
  showHeader = true,
  chipStripVariant = 'default',
  telemetry,
}: CuratedPromoDiscoveryWidgetProps) {
  const emitter = telemetry ?? getDefaultFirstReleaseTelemetry()
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
  const publishedEmpty = promos.length === 0
  const discoveryViewEligible = promos.length > 0
  const filterEmpty = promos.length > 0 && visiblePromos.length === 0

  useEffect(() => {
    if (!discoveryViewEligible) return
    emitApprovedEventFailSoft(
      emitter,
      'curated_promo_discovery_view',
      {},
      { onceKey: discoveryViewOnceKey() },
    )
  }, [discoveryViewEligible, emitter])

  useEffect(() => {
    if (!publishedEmpty) return
    emitApprovedEventFailSoft(
      emitter,
      'curated_promo_empty_state_view',
      { reason: 'published_empty' },
      { onceKey: emptyStateOnceKey('published_empty') },
    )
  }, [publishedEmpty, emitter])

  useEffect(() => {
    if (!filterEmpty) return
    emitApprovedEventFailSoft(
      emitter,
      'curated_promo_empty_state_view',
      { reason: 'filter_empty' },
      { onceKey: emptyStateOnceKey('filter_empty') },
    )
  }, [filterEmpty, emitter])

  const handleFilterChange = (next: CuratedPromoFilters) => {
    const vocabulary = toTelemetryFilterVocabulary(filterOptions)
    const payload = filterClickPayloadFromToggle(filters, next)
    setFilters(next)
    if (payload) {
      emitApprovedEventFailSoft(emitter, 'curated_promo_filter_click', payload, {
        filterVocabulary: vocabulary,
      })
    }
  }

  const handleOpenPromo = (promo: CuratedPromoDiscoveryDTO) => {
    setSelectedPromo(promo)
    emitApprovedEventFailSoft(emitter, 'curated_promo_card_open', {
      promoId: promo.promoId,
    })
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
        <CuratedPromoDetailSheet
          promo={selectedPromo}
          onClose={() => setSelectedPromo(null)}
          telemetry={emitter}
        />
      )}
    </div>
  )
}
