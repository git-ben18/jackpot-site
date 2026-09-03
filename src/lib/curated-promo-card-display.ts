import type { CuratedPromoDiscoveryDTO } from '../types/curatedPromos'
import {
  getCategoryLabel,
  getPromoSignalCategories,
} from './constants/curatedPromoSignalCategory'
import { formatActiveStatus, humanizeToken, signalDisplayValue } from './curated-promo-display'

export type CuratedPromoCardMeta = {
  statusLabel: string
  offerTypeLabel: string | null
  metaChips: string[]
}

export function getActiveStatusPillClasses(
  status: CuratedPromoDiscoveryDTO['activeStatus'],
): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'upcoming':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'expired':
      return 'bg-slate-100 text-slate-500 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

/**
 * Card-face metadata for curated promos — mirrors hottest-offers meta row without scores/values.
 * Priority: badges → top signal highlight → place label.
 */
export function getCuratedPromoCardMeta(promo: CuratedPromoDiscoveryDTO): CuratedPromoCardMeta {
  const statusLabel = formatActiveStatus(promo.activeStatus)
  const categories = getPromoSignalCategories(promo)
  const offerTypeLabel = categories.length > 0 ? getCategoryLabel(categories[0]) : null

  const metaChips: string[] = []

  for (const badge of promo.badges.slice(0, 2)) {
    if (badge && !metaChips.includes(badge)) {
      metaChips.push(badge)
    }
  }

  if (metaChips.length === 0 && promo.topSignals.length > 0) {
    const signal = promo.topSignals[0]
    const label = signal.label ?? signal.signalType
    const value = signalDisplayValue(signal)
    const highlight = label ? `${label}: ${value}` : value
    if (highlight && highlight !== '—') {
      metaChips.push(highlight)
    }
  }

  if (metaChips.length === 0) {
    const place =
      promo.locationLabel?.trim() ||
      (promo.marketSlug ? humanizeToken(promo.marketSlug) : null)
    if (place) {
      metaChips.push(place)
    }
  }

  return { statusLabel, offerTypeLabel, metaChips }
}
