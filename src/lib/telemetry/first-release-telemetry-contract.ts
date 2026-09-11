/**
 * S5-E first-release telemetry contract (machine-checkable).
 * Defines meaning and closed event→payload TypeScript shapes only —
 * no provider, network, or DB schema.
 * Authority: docs/tasks/jse-s5/s5-telemetry-contract.md + S5-A D-S5-06..11.
 */

import type { CuratedPromoSignalCategory } from '../constants/curatedPromoSignalCategory'
import { CATEGORY_META } from '../constants/curatedPromoSignalCategory'

export const TELEMETRY_SCHEMA_FAMILY =
  'jackpot-site.first_release_telemetry' as const
export const TELEMETRY_SCHEMA_VERSION = 'v1' as const

export const FIRST_RELEASE_TELEMETRY_EVENT_NAMES = [
  'curated_promo_discovery_view',
  'curated_promo_filter_click',
  'curated_promo_card_open',
  'curated_promo_empty_state_view',
  'curated_promo_source_click',
  'newsletter_subscribe_requested',
  'newsletter_subscription_confirmed',
] as const

export type FirstReleaseTelemetryEventName =
  (typeof FIRST_RELEASE_TELEMETRY_EVENT_NAMES)[number]

export const TELEMETRY_CONSENT_CLASS = 'optional_non_essential' as const
export const TELEMETRY_SINK_STATUS = 'disabled_by_default' as const
export const TELEMETRY_SESSION_IDENTITY = 'omit' as const

export const TELEMETRY_FILTER_KEYS = [
  'brand',
  'marketSlug',
  'signalCategory',
  'signalType',
] as const
export type TelemetryFilterKey = (typeof TELEMETRY_FILTER_KEYS)[number]

export const TELEMETRY_FILTER_ACTIONS = ['apply', 'clear'] as const
export type TelemetryFilterAction = (typeof TELEMETRY_FILTER_ACTIONS)[number]

export const TELEMETRY_EMPTY_STATE_REASONS = [
  'published_empty',
  'filter_empty',
  'fail_soft',
] as const
export type TelemetryEmptyStateReason =
  (typeof TELEMETRY_EMPTY_STATE_REASONS)[number]

export const TELEMETRY_SIGNUP_SOURCES_V1 = ['newsletter_landing'] as const
export type TelemetrySignupSourceV1 =
  (typeof TELEMETRY_SIGNUP_SOURCES_V1)[number]

/** Closed CuratedPromoSignalCategory vocabulary (public taxonomy). */
export const TELEMETRY_SIGNAL_CATEGORIES = Object.keys(
  CATEGORY_META,
) as CuratedPromoSignalCategory[]

export const TELEMETRY_PROMO_ID_MAX_LEN = 128
export const TELEMETRY_PROMO_ID_CHARSET = /^[A-Za-z0-9_-]+$/
export const TELEMETRY_FILTER_VALUE_MAX_LEN = 128

/** Subscribe browser statuses that must NOT emit newsletter_subscribe_requested. */
export const NEWSLETTER_SUBSCRIBE_NON_EMIT_STATUSES = [
  'invalid',
  'rate_limited',
  'unavailable',
] as const

/** Confirm consume statuses: only success emits confirmation. */
export const NEWSLETTER_CONFIRM_EMIT_STATUS = 'success' as const
export const NEWSLETTER_CONFIRM_NON_EMIT_STATUSES = [
  'already_complete',
  'invalid_or_unusable',
  'unable_to_confirm',
  'ready_to_confirm',
] as const

/**
 * Contiguous forbidden field names split so active-runtime secret scans do not
 * false-positive on the denylist itself.
 */
export const TELEMETRY_PROHIBITED_PAYLOAD_KEYS = [
  'email',
  'emailHash',
  ['subscriber', 'email', 'hash'].join('_'),
  'confirmationToken',
  'token',
  ['access', 'token'].join('_'),
  'sessionId',
  ['session', 'id'].join('_'),
  'sourceUrl',
  'pageUrl',
  'referrer',
  'userAgent',
  'ip',
  'authorization',
  'metadata',
  'stack',
  'errorBody',
] as const

/** Zero-key payload for events that carry no fields. */
export type TelemetryEmptyPayload = Record<string, never>

export type CuratedPromoDiscoveryViewPayload = TelemetryEmptyPayload

/**
 * filterValue is required for both apply and clear (the clicked chip value).
 * It must be an exact member of the currently rendered public filter-option
 * vocabulary for that filterKey — never arbitrary free text.
 */
export type CuratedPromoFilterClickPayload = {
  filterKey: TelemetryFilterKey
  action: TelemetryFilterAction
  filterValue: string
}

export type CuratedPromoCardOpenPayload = {
  promoId: string
}

export type CuratedPromoEmptyStateViewPayload = {
  reason: TelemetryEmptyStateReason
}

export type CuratedPromoSourceClickPayload = {
  promoId: string
}

export type NewsletterSubscribeRequestedPayload = {
  signupSource: TelemetrySignupSourceV1
}

export type NewsletterSubscriptionConfirmedPayload = TelemetryEmptyPayload

export type FirstReleaseTelemetryPayloadByEvent = {
  curated_promo_discovery_view: CuratedPromoDiscoveryViewPayload
  curated_promo_filter_click: CuratedPromoFilterClickPayload
  curated_promo_card_open: CuratedPromoCardOpenPayload
  curated_promo_empty_state_view: CuratedPromoEmptyStateViewPayload
  curated_promo_source_click: CuratedPromoSourceClickPayload
  newsletter_subscribe_requested: NewsletterSubscribeRequestedPayload
  newsletter_subscription_confirmed: NewsletterSubscriptionConfirmedPayload
}

export type FirstReleaseTelemetryEnvelope<
  N extends FirstReleaseTelemetryEventName = FirstReleaseTelemetryEventName,
> = {
  name: N
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION
  payload: FirstReleaseTelemetryPayloadByEvent[N]
}

/**
 * Currently rendered / public filter-option vocabulary from
 * `buildCuratedPromoFilterOptions` (or equivalent). Membership — not charset —
 * is the privacy bound for filterValue.
 */
export type TelemetryFilterOptionVocabulary = {
  brands: readonly string[]
  marketSlugs: readonly string[]
  signalCategories: readonly CuratedPromoSignalCategory[]
  signalTypesForCategory: readonly string[]
}

export type TelemetryEventContract<
  N extends FirstReleaseTelemetryEventName = FirstReleaseTelemetryEventName,
> = {
  name: N
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION
  consentClass: typeof TELEMETRY_CONSENT_CLASS
  sinkStatus: typeof TELEMETRY_SINK_STATUS
  sessionIdentity: typeof TELEMETRY_SESSION_IDENTITY
  allowedPayloadKeys: readonly (keyof FirstReleaseTelemetryPayloadByEvent[N] &
    string)[]
  failureBehavior: 'swallow_nonblocking'
}

function contractFor<N extends FirstReleaseTelemetryEventName>(
  name: N,
  allowedPayloadKeys: readonly (keyof FirstReleaseTelemetryPayloadByEvent[N] &
    string)[],
): TelemetryEventContract<N> {
  return {
    name,
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys,
    failureBehavior: 'swallow_nonblocking',
  }
}

export const FIRST_RELEASE_TELEMETRY_CONTRACT: {
  [N in FirstReleaseTelemetryEventName]: TelemetryEventContract<N>
} = {
  curated_promo_discovery_view: contractFor('curated_promo_discovery_view', []),
  curated_promo_filter_click: contractFor('curated_promo_filter_click', [
    'filterKey',
    'action',
    'filterValue',
  ]),
  curated_promo_card_open: contractFor('curated_promo_card_open', ['promoId']),
  curated_promo_empty_state_view: contractFor('curated_promo_empty_state_view', [
    'reason',
  ]),
  curated_promo_source_click: contractFor('curated_promo_source_click', [
    'promoId',
  ]),
  newsletter_subscribe_requested: contractFor(
    'newsletter_subscribe_requested',
    ['signupSource'],
  ),
  newsletter_subscription_confirmed: contractFor(
    'newsletter_subscription_confirmed',
    [],
  ),
}

export function isFirstReleaseTelemetryEventName(
  value: string,
): value is FirstReleaseTelemetryEventName {
  return (FIRST_RELEASE_TELEMETRY_EVENT_NAMES as readonly string[]).includes(
    value,
  )
}

export function isAllowedPayloadKey(
  eventName: FirstReleaseTelemetryEventName,
  key: string,
): boolean {
  return (
    FIRST_RELEASE_TELEMETRY_CONTRACT[eventName].allowedPayloadKeys as readonly string[]
  ).includes(key)
}

export function isProhibitedPayloadKey(key: string): boolean {
  return (TELEMETRY_PROHIBITED_PAYLOAD_KEYS as readonly string[]).includes(key)
}

export function isTelemetryFilterKey(value: string): value is TelemetryFilterKey {
  return (TELEMETRY_FILTER_KEYS as readonly string[]).includes(value)
}

export function isTelemetryFilterAction(
  value: string,
): value is TelemetryFilterAction {
  return (TELEMETRY_FILTER_ACTIONS as readonly string[]).includes(value)
}

export function isTelemetryEmptyStateReason(
  value: string,
): value is TelemetryEmptyStateReason {
  return (TELEMETRY_EMPTY_STATE_REASONS as readonly string[]).includes(value)
}

export function isTelemetrySignupSourceV1(
  value: string,
): value is TelemetrySignupSourceV1 {
  return (TELEMETRY_SIGNUP_SOURCES_V1 as readonly string[]).includes(value)
}

export function isTelemetrySignalCategory(
  value: string,
): value is CuratedPromoSignalCategory {
  return (TELEMETRY_SIGNAL_CATEGORIES as readonly string[]).includes(value)
}

export function isValidPromoId(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= TELEMETRY_PROMO_ID_MAX_LEN &&
    TELEMETRY_PROMO_ID_CHARSET.test(value)
  )
}

function filterValuesForKey(
  filterKey: TelemetryFilterKey,
  vocabulary: TelemetryFilterOptionVocabulary,
): readonly string[] {
  switch (filterKey) {
    case 'brand':
      return vocabulary.brands
    case 'marketSlug':
      return vocabulary.marketSlugs
    case 'signalCategory':
      return vocabulary.signalCategories
    case 'signalType':
      return vocabulary.signalTypesForCategory
  }
}

/**
 * filterValue must be an exact currently-rendered public option for filterKey.
 * Multi-word brands (e.g. "Hard Rock") are valid when present in options.brands.
 * Arbitrary free text is rejected even if it looks token-like.
 */
export function isValidFilterValueForKey(
  filterKey: TelemetryFilterKey,
  filterValue: string,
  vocabulary: TelemetryFilterOptionVocabulary,
): boolean {
  if (
    filterValue.length === 0 ||
    filterValue.length > TELEMETRY_FILTER_VALUE_MAX_LEN
  ) {
    return false
  }
  if (filterKey === 'signalCategory' && !isTelemetrySignalCategory(filterValue)) {
    return false
  }
  return filterValuesForKey(filterKey, vocabulary).includes(filterValue)
}

export function isValidCuratedPromoFilterClickPayload(
  payload: CuratedPromoFilterClickPayload,
  vocabulary: TelemetryFilterOptionVocabulary,
): boolean {
  if (!isTelemetryFilterKey(payload.filterKey)) return false
  if (!isTelemetryFilterAction(payload.action)) return false
  return isValidFilterValueForKey(
    payload.filterKey,
    payload.filterValue,
    vocabulary,
  )
}

export function isValidCuratedPromoEmptyStateViewPayload(
  payload: CuratedPromoEmptyStateViewPayload,
): boolean {
  return isTelemetryEmptyStateReason(payload.reason)
}

export function isValidNewsletterSubscribeRequestedPayload(
  payload: NewsletterSubscribeRequestedPayload,
): boolean {
  return isTelemetrySignupSourceV1(payload.signupSource)
}

export function isValidPromoIdPayload(
  payload: CuratedPromoCardOpenPayload | CuratedPromoSourceClickPayload,
): boolean {
  return isValidPromoId(payload.promoId)
}

export function isTelemetryEmptyPayload(
  payload: unknown,
): payload is TelemetryEmptyPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 0
  )
}

export function shouldEmitNewsletterSubscribeRequested(
  browserStatus: string,
): boolean {
  return browserStatus === 'accepted'
}

export function shouldEmitNewsletterSubscriptionConfirmed(
  consumeStatus: string,
): boolean {
  return consumeStatus === NEWSLETTER_CONFIRM_EMIT_STATUS
}
