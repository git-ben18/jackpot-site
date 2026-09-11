'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CuratedPromoDiscoveryDTO } from '../../../types/curatedPromos'
import {
  EMPTY_CURATED_PROMO_FILTERS,
  type CuratedPromoFilters,
} from '../../../types/curatedPromos'
import {
  buildCuratedPromoFilterOptions,
  filterCuratedPromos,
} from '../../../lib/curated-promo-display'
import { getFirstReleaseTelemetry } from '../../../lib/telemetry/first-release-telemetry-runtime'
import type { FirstReleaseTelemetrySeam } from '../../../lib/telemetry/first-release-telemetry-seam'
import CuratedPromoCarousel from './CuratedPromoCarousel'
import CuratedPromoDetailSheet from './CuratedPromoDetailSheet'
import CuratedPromoEmptyState from './CuratedPromoEmptyState'
import CuratedPromoFilterChips, {
  type CuratedPromoFilterToggleDetail,
} from './CuratedPromoFilterChips'

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
  /** Optional injected telemetry seam (tests). Defaults to runtime singleton. */
  telemetry?: FirstReleaseTelemetrySeam
}

export default function CuratedPromoDiscoveryWidget({
  promos,
  defaultBrand = null,
  defaultMarketSlug = null,
  title = 'Curated promos',
  subtitle = 'Filter by place or offer type.',
  showHeader = true,
  chipStripVariant = 'default',
  telemetry: telemetryProp,
}: CuratedPromoDiscoveryWidgetProps) {
  const telemetry = telemetryProp ?? getFirstReleaseTelemetry()
  const [filters, setFilters] = useState<CuratedPromoFilters>({
    ...EMPTY_CURATED_PROMO_FILTERS,
    brand: defaultBrand,
    marketSlug: defaultMarketSlug,
  })
  const [selectedPromo, setSelectedPromo] = useState<CuratedPromoDiscoveryDTO | null>(null)
  const discoveryViewEmitted = useRef(false)
  const emptyReasonsEmitted = useRef(new Set<string>())

  const filterOptions = useMemo(
    () => buildCuratedPromoFilterOptions(promos, filters),
    [promos, filters],
  )

  const visiblePromos = useMemo(
    () => filterCuratedPromos(promos, filters),
    [promos, filters],
  )

  useEffect(() => {
    if (promos.length === 0) {
      if (!emptyReasonsEmitted.current.has('published_empty')) {
        emptyReasonsEmitted.current.add('published_empty')
        telemetry.emitApprovedEvent('curated_promo_empty_state_view', {
          reason: 'published_empty',
        })
      }
      return
    }

    if (!discoveryViewEmitted.current) {
      discoveryViewEmitted.current = true
      telemetry.emitApprovedEvent('curated_promo_discovery_view', {})
    }

    if (visiblePromos.length === 0) {
      if (!emptyReasonsEmitted.current.has('filter_empty')) {
        emptyReasonsEmitted.current.add('filter_empty')
        telemetry.emitApprovedEvent('curated_promo_empty_state_view', {
          reason: 'filter_empty',
        })
      }
    }
  }, [promos.length, visiblePromos.length, telemetry])

  const handleFilterChange = (
    next: CuratedPromoFilters,
    toggle?: CuratedPromoFilterToggleDetail,
  ) => {
    setFilters(next)
    if (!toggle) return
    telemetry.emitApprovedEvent(
      'curated_promo_filter_click',
      {
        filterKey: toggle.filterKey,
        action: toggle.action,
        filterValue: toggle.filterValue,
      },
      {
        filterVocabulary: {
          brands: filterOptions.brands,
          marketSlugs: filterOptions.marketSlugs,
          signalCategories: filterOptions.signalCategories,
          signalTypesForCategory: filterOptions.signalTypesForCategory,
        },
      },
    )
  }

  const handleOpenPromo = (promo: CuratedPromoDiscoveryDTO) => {
    telemetry.emitApprovedEvent('curated_promo_card_open', {
      promoId: promo.promoId,
    })
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
        <CuratedPromoDetailSheet
          promo={selectedPromo}
          onClose={() => setSelectedPromo(null)}
          telemetry={telemetry}
        />
      )}
    </div>
  )
}
