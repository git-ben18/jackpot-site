import React, { type ReactNode } from 'react'
import type { CuratedPromoFilterOptions } from '../../../lib/curated-promo-display'
import { humanizeSignalType, humanizeToken } from '../../../lib/curated-promo-display'
import { getCategoryLabel } from '../../../lib/constants/curatedPromoSignalCategory'
import {
  getNicheForPlaceChip,
  NICHE_COLORS,
  sortBrandsByNicheOrder,
  type MarketNiche,
} from '../../../lib/constants/nicheMap'
import type { CuratedPromoFilters } from '../../../types/curatedPromos'

/** Source-kind chips omitted — see JSE-S3 plan / source product decisions. */

type CuratedPromoFilterChipsProps = {
  filters: CuratedPromoFilters
  options: CuratedPromoFilterOptions
  onFilterChange: (next: CuratedPromoFilters) => void
  variant?: 'default' | 'landing'
}

function ChipRow({
  label,
  children,
  variant,
}: {
  label: string
  children: ReactNode
  variant: 'default' | 'landing'
}) {
  const labelClass =
    variant === 'landing'
      ? 'text-[10px] font-bold uppercase tracking-wide text-slate-500'
      : 'text-xs font-semibold uppercase tracking-wide text-slate-500'
  const rowClass =
    variant === 'landing'
      ? 'flex gap-2 overflow-x-auto pb-1 scrollbar-hide chip-strip-fade'
      : 'flex gap-2 overflow-x-auto pb-1 scrollbar-thin'

  return (
    <div className="space-y-2">
      <p className={labelClass}>{label}</p>
      <div className={rowClass}>{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  label,
  onClick,
  variant,
}: {
  active: boolean
  label: string
  onClick: () => void
  variant: 'default' | 'landing'
}) {
  const landingActive =
    'bg-amber-500 text-white border-amber-500 shadow-sm'
  const landingInactive =
    'bg-white border border-amber-200 text-amber-900 hover:bg-amber-50 active:bg-amber-100'
  const defaultActive = 'bg-slate-900 text-white'
  const defaultInactive = 'bg-slate-100 text-slate-700 hover:bg-slate-200'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        variant === 'landing'
          ? active
            ? landingActive
            : landingInactive
          : active
            ? defaultActive
            : defaultInactive
      }`}
    >
      {label}
    </button>
  )
}

function placeChipClasses(niche: MarketNiche, active: boolean): string {
  const nc = NICHE_COLORS[niche]
  const base =
    'shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-150'
  if (active) {
    return `${base} ${nc.activeBg} ${nc.activeText} border-transparent`
  }
  return `${base} ${nc.bg} ${nc.border} ${nc.text} hover:brightness-95`
}

function PlaceBrandChip({
  brand,
  active,
  onClick,
}: {
  brand: string
  active: boolean
  onClick: () => void
}) {
  const niche = getNicheForPlaceChip(brand)
  const nc = NICHE_COLORS[niche]

  return (
    <button
      type="button"
      onClick={onClick}
      className={placeChipClasses(niche, active)}
      aria-pressed={active}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-white/60' : ''}`}
        style={active ? undefined : { backgroundColor: nc.accent }}
        aria-hidden
      />
      {brand}
    </button>
  )
}

/** Geographic market slugs — neutral slate styling (not brand tier). */
function PlaceMarketChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const nc = NICHE_COLORS.Other

  return (
    <button
      type="button"
      onClick={onClick}
      className={placeChipClasses('Other', active)}
      aria-pressed={active}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-white/60' : ''}`}
        style={active ? undefined : { backgroundColor: nc.accent }}
        aria-hidden
      />
      {label}
    </button>
  )
}

function PlacesChipRow({
  brands,
  marketSlugs,
  filters,
  onToggleBrand,
  onToggleMarket,
  variant,
}: {
  brands: string[]
  marketSlugs: string[]
  filters: CuratedPromoFilters
  onToggleBrand: (brand: string) => void
  onToggleMarket: (slug: string) => void
  variant: 'default' | 'landing'
}) {
  const sortedBrands = sortBrandsByNicheOrder(brands)

  return (
    <ChipRow label="Places" variant={variant}>
      {sortedBrands.map((brand, index) => {
        const niche = getNicheForPlaceChip(brand)
        const prevNiche =
          index > 0 ? getNicheForPlaceChip(sortedBrands[index - 1]) : null
        const showGroupGap = index > 0 && prevNiche !== niche

        return (
          <span key={`brand:${brand}`} className={`flex shrink-0 items-center ${showGroupGap ? 'ml-1' : ''}`}>
            {showGroupGap && (
              <span
                className="mr-2 h-4 w-px shrink-0 bg-slate-200"
                aria-hidden
              />
            )}
            <PlaceBrandChip
              brand={brand}
              active={filters.brand === brand}
              onClick={() => onToggleBrand(brand)}
            />
          </span>
        )
      })}
      {marketSlugs.map((slug) => (
        <PlaceMarketChip
          key={`market:${slug}`}
          label={humanizeToken(slug)}
          active={filters.marketSlug === slug}
          onClick={() => onToggleMarket(slug)}
        />
      ))}
    </ChipRow>
  )
}

export default function CuratedPromoFilterChips({
  filters,
  options,
  onFilterChange,
  variant = 'default',
}: CuratedPromoFilterChipsProps) {
  const toggle = <K extends keyof CuratedPromoFilters>(key: K, value: CuratedPromoFilters[K]) => {
    const nextValue = filters[key] === value ? null : value
    const next: CuratedPromoFilters = { ...filters, [key]: nextValue }
    if (key === 'signalCategory') {
      next.signalType = null
    }
    onFilterChange(next)
  }

  const hasPlaceChips = options.brands.length > 0 || options.marketSlugs.length > 0

  return (
    <div className={variant === 'landing' ? 'space-y-3' : 'space-y-4'}>
      {hasPlaceChips && (
        <PlacesChipRow
          brands={options.brands}
          marketSlugs={options.marketSlugs}
          filters={filters}
          onToggleBrand={(brand) => toggle('brand', brand)}
          onToggleMarket={(slug) => toggle('marketSlug', slug)}
          variant={variant}
        />
      )}

      {options.signalCategories.length > 0 && (
        <ChipRow label="Offer types" variant={variant}>
          {options.signalCategories.map((category) => (
            <FilterChip
              key={category}
              active={filters.signalCategory === category}
              label={getCategoryLabel(category)}
              onClick={() => toggle('signalCategory', category)}
              variant={variant}
            />
          ))}
        </ChipRow>
      )}

      {filters.signalCategory && options.signalTypesForCategory.length > 0 && (
        <ChipRow label="Signal type" variant={variant}>
          {options.signalTypesForCategory.map((signalType) => (
            <FilterChip
              key={signalType}
              active={filters.signalType === signalType}
              label={humanizeSignalType(signalType)}
              onClick={() => toggle('signalType', signalType)}
              variant={variant}
            />
          ))}
        </ChipRow>
      )}
    </div>
  )
}
