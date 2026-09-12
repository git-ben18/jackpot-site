/**
 * S5-F trigger helpers — map product state diffs to S5-E payloads.
 * No consent, network, or provider logic.
 */
import type { CuratedPromoFilterOptions } from '../curated-promo-display'
import type { CuratedPromoFilters } from '../../types/curatedPromos'
import {
  TELEMETRY_FILTER_KEYS,
  type CuratedPromoFilterClickPayload,
  type TelemetryEmptyStateReason,
  type TelemetryFilterKey,
  type TelemetryFilterOptionVocabulary,
} from './first-release-telemetry-contract'

export function toTelemetryFilterVocabulary(
  options: CuratedPromoFilterOptions,
): TelemetryFilterOptionVocabulary {
  return {
    brands: options.brands,
    marketSlugs: options.marketSlugs,
    signalCategories: options.signalCategories,
    signalTypesForCategory: options.signalTypesForCategory,
  }
}

export function discoveryViewOnceKey(): string {
  return 'curated_promo_discovery_view'
}

export function emptyStateOnceKey(reason: TelemetryEmptyStateReason): string {
  return `curated_promo_empty_state_view:${reason}`
}

export function newsletterConfirmedOnceKey(): string {
  return 'newsletter_subscription_confirmed'
}

/**
 * Chip toggles one key. Category change also clears signalType — emit only
 * the clicked key, never a second synthetic signalType event.
 */
export function filterClickPayloadFromToggle(
  previous: CuratedPromoFilters,
  next: CuratedPromoFilters,
): CuratedPromoFilterClickPayload | null {
  const changed = TELEMETRY_FILTER_KEYS.filter(
    (key) => previous[key] !== next[key],
  )
  if (changed.length === 0) return null

  const filterKey: TelemetryFilterKey = changed.includes('signalCategory')
    ? 'signalCategory'
    : changed[0]
  if (!changed.includes('signalCategory') && changed.length !== 1) {
    return null
  }

  const previousValue = previous[filterKey]
  const nextValue = next[filterKey]
  if (nextValue && previousValue !== nextValue) {
    return { filterKey, action: 'apply', filterValue: nextValue }
  }
  if (previousValue && !nextValue) {
    return { filterKey, action: 'clear', filterValue: previousValue }
  }
  return null
}
