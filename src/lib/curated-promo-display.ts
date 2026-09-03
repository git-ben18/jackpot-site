import type { CuratedPromoDiscoveryDTO, CuratedPromoFilters } from '../types/curatedPromos'
import type { CuratedPromoSignalCategory } from './constants/curatedPromoSignalCategory'
import {
  getSignalTypesForCategory,
  getVisibleCategoryChips,
  promoHasSignalCategory,
  signalTypeBelongsToCategory,
} from './constants/curatedPromoSignalCategory'

export function humanizeToken(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function humanizeSourceKind(sourceKind: string | null | undefined): string {
  if (!sourceKind) return 'Unknown source'
  return humanizeToken(sourceKind)
}

export function humanizeSignalType(signalType: string): string {
  return humanizeToken(signalType)
}

export function hasActiveCuratedPromoFilters(filters: CuratedPromoFilters): boolean {
  return Boolean(
    filters.brand ||
      filters.marketSlug ||
      filters.signalCategory ||
      filters.signalType ||
      filters.sourceKind,
  )
}

export function promoMatchesCuratedFilters(
  promo: CuratedPromoDiscoveryDTO,
  filters: CuratedPromoFilters,
): boolean {
  if (filters.brand && promo.brand !== filters.brand) return false
  if (filters.marketSlug && promo.marketSlug !== filters.marketSlug) return false
  if (filters.sourceKind && promo.sourceKind !== filters.sourceKind) return false
  if (filters.signalCategory && !promoHasSignalCategory(promo, filters.signalCategory)) return false
  if (filters.signalType) {
    if (!promo.signalTypes.includes(filters.signalType)) return false
    if (
      filters.signalCategory &&
      !signalTypeBelongsToCategory(filters.signalType, filters.signalCategory)
    ) {
      return false
    }
  }
  return true
}

export function filterCuratedPromos(
  promos: CuratedPromoDiscoveryDTO[],
  filters: CuratedPromoFilters,
): CuratedPromoDiscoveryDTO[] {
  return promos.filter((promo) => promoMatchesCuratedFilters(promo, filters))
}

export type CuratedPromoFilterOptions = {
  brands: string[]
  marketSlugs: string[]
  signalCategories: CuratedPromoSignalCategory[]
  sourceKinds: string[]
  signalTypesForCategory: string[]
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

export function buildCuratedPromoFilterOptions(
  promos: CuratedPromoDiscoveryDTO[],
  filters: CuratedPromoFilters,
): CuratedPromoFilterOptions {
  const brands = uniqueSorted(promos.map((p) => p.brand))
  const marketSlugs = uniqueSorted(
    promos.map((p) => p.marketSlug).filter((slug): slug is string => Boolean(slug)),
  )
  const signalCategories = getVisibleCategoryChips(promos).filter((category) =>
    promos.some((promo) => promoHasSignalCategory(promo, category)),
  )
  const sourceKinds = uniqueSorted(
    promos.map((p) => (typeof p.sourceKind === 'string' ? p.sourceKind : null)).filter((k): k is string => Boolean(k)),
  )

  let signalTypesForCategory: string[] = []
  if (filters.signalCategory) {
    signalTypesForCategory = getSignalTypesForCategory(promos, filters.signalCategory)
  }

  return { brands, marketSlugs, signalCategories, sourceKinds, signalTypesForCategory }
}

export function formatActiveStatus(status: CuratedPromoDiscoveryDTO['activeStatus']): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'upcoming':
      return 'Upcoming'
    case 'expired':
      return 'Expired'
    default:
      return 'Status unknown'
  }
}

export function signalDisplayValue(signal: CuratedPromoDiscoveryDTO['signals'][number]): string {
  return signal.valueNormalized?.trim() || signal.valueRaw.trim() || signal.label?.trim() || '—'
}
