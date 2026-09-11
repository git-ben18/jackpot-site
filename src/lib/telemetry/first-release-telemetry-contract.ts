/**
 * S5-E first-release telemetry contract (machine-checkable).
 * Defines meaning only — no provider, network, or DB schema.
 * Authority: docs/tasks/jse-s5/s5-telemetry-contract.md + S5-A D-S5-06..11.
 */

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

export const TELEMETRY_FILTER_ACTIONS = ['apply', 'clear'] as const

export const TELEMETRY_EMPTY_STATE_REASONS = [
  'published_empty',
  'filter_empty',
  'fail_soft',
] as const

export const TELEMETRY_SIGNUP_SOURCES_V1 = ['newsletter_landing'] as const

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

export type TelemetryEventContract = {
  name: FirstReleaseTelemetryEventName
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION
  consentClass: typeof TELEMETRY_CONSENT_CLASS
  sinkStatus: typeof TELEMETRY_SINK_STATUS
  sessionIdentity: typeof TELEMETRY_SESSION_IDENTITY
  allowedPayloadKeys: readonly string[]
  failureBehavior: 'swallow_nonblocking'
}

export const FIRST_RELEASE_TELEMETRY_CONTRACT: Record<
  FirstReleaseTelemetryEventName,
  TelemetryEventContract
> = {
  curated_promo_discovery_view: {
    name: 'curated_promo_discovery_view',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: [],
    failureBehavior: 'swallow_nonblocking',
  },
  curated_promo_filter_click: {
    name: 'curated_promo_filter_click',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: ['filterKey', 'action', 'filterValue'],
    failureBehavior: 'swallow_nonblocking',
  },
  curated_promo_card_open: {
    name: 'curated_promo_card_open',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: ['promoId'],
    failureBehavior: 'swallow_nonblocking',
  },
  curated_promo_empty_state_view: {
    name: 'curated_promo_empty_state_view',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: ['reason'],
    failureBehavior: 'swallow_nonblocking',
  },
  curated_promo_source_click: {
    name: 'curated_promo_source_click',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: ['promoId'],
    failureBehavior: 'swallow_nonblocking',
  },
  newsletter_subscribe_requested: {
    name: 'newsletter_subscribe_requested',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: ['signupSource'],
    failureBehavior: 'swallow_nonblocking',
  },
  newsletter_subscription_confirmed: {
    name: 'newsletter_subscription_confirmed',
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    consentClass: TELEMETRY_CONSENT_CLASS,
    sinkStatus: TELEMETRY_SINK_STATUS,
    sessionIdentity: TELEMETRY_SESSION_IDENTITY,
    allowedPayloadKeys: [],
    failureBehavior: 'swallow_nonblocking',
  },
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
  return FIRST_RELEASE_TELEMETRY_CONTRACT[eventName].allowedPayloadKeys.includes(
    key,
  )
}

export function isProhibitedPayloadKey(key: string): boolean {
  return (TELEMETRY_PROHIBITED_PAYLOAD_KEYS as readonly string[]).includes(key)
}

/** Token-like filterValue / promoId guard (contract charset). */
export function isTelemetryTokenValue(
  value: string,
  maxLen: number,
  charset: RegExp,
): boolean {
  return value.length > 0 && value.length <= maxLen && charset.test(value)
}

export const TELEMETRY_FILTER_VALUE_CHARSET = /^[A-Za-z0-9_.:-]+$/
export const TELEMETRY_PROMO_ID_CHARSET = /^[A-Za-z0-9_-]+$/

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
