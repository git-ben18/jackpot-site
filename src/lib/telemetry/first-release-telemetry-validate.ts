/**
 * S5-F closed payload validation. Reject extra/prohibited keys; do not forward them.
 * Invalid payloads never reach transport.
 */
import {
  FIRST_RELEASE_TELEMETRY_CONTRACT,
  isAllowedPayloadKey,
  isFirstReleaseTelemetryEventName,
  isProhibitedPayloadKey,
  isTelemetryEmptyPayload,
  isValidCuratedPromoEmptyStateViewPayload,
  isValidCuratedPromoFilterClickPayload,
  isValidNewsletterSubscribeRequestedPayload,
  isValidPromoIdPayload,
  type FirstReleaseTelemetryEventName,
  type FirstReleaseTelemetryPayloadByEvent,
  type TelemetryFilterOptionVocabulary,
} from './first-release-telemetry-contract'

export type ValidatedTelemetryPayload = {
  [N in FirstReleaseTelemetryEventName]: {
    ok: true
    name: N
    payload: FirstReleaseTelemetryPayloadByEvent[N]
  }
}[FirstReleaseTelemetryEventName]

export type ValidateTelemetryPayloadResult =
  | ValidatedTelemetryPayload
  | { ok: false; reason: 'unknown_event' | 'invalid_payload' }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Reject email-like or URL-bearing string values even if a key were somehow allowlisted. */
function stringValueLooksProhibited(value: string): boolean {
  if (value.includes('@')) return true
  if (/https?:\/\//i.test(value)) return true
  return false
}

function payloadValuesAreScalarAndClean(payload: Record<string, unknown>): boolean {
  for (const value of Object.values(payload)) {
    if (value === null || value === undefined) return false
    if (typeof value === 'object') return false
    if (typeof value === 'string' && stringValueLooksProhibited(value)) return false
    if (typeof value !== 'string') return false
  }
  return true
}

export function validateFirstReleaseTelemetryPayload(
  eventName: string,
  payload: unknown,
  filterVocabulary?: TelemetryFilterOptionVocabulary,
): ValidateTelemetryPayloadResult {
  if (!isFirstReleaseTelemetryEventName(eventName)) {
    return { ok: false, reason: 'unknown_event' }
  }
  if (!isPlainObject(payload)) {
    return { ok: false, reason: 'invalid_payload' }
  }

  const keys = Object.keys(payload)
  for (const key of keys) {
    if (isProhibitedPayloadKey(key)) {
      return { ok: false, reason: 'invalid_payload' }
    }
    if (!isAllowedPayloadKey(eventName, key)) {
      return { ok: false, reason: 'invalid_payload' }
    }
  }

  const allowed = FIRST_RELEASE_TELEMETRY_CONTRACT[eventName].allowedPayloadKeys
  if (keys.length !== allowed.length) {
    return { ok: false, reason: 'invalid_payload' }
  }
  for (const required of allowed) {
    if (!keys.includes(required)) {
      return { ok: false, reason: 'invalid_payload' }
    }
  }

  if (allowed.length > 0 && !payloadValuesAreScalarAndClean(payload)) {
    return { ok: false, reason: 'invalid_payload' }
  }

  switch (eventName) {
    case 'curated_promo_discovery_view':
    case 'newsletter_subscription_confirmed':
      if (!isTelemetryEmptyPayload(payload)) {
        return { ok: false, reason: 'invalid_payload' }
      }
      return { ok: true, name: eventName, payload }
    case 'curated_promo_filter_click': {
      if (!filterVocabulary) {
        return { ok: false, reason: 'invalid_payload' }
      }
      const candidate = payload as {
        filterKey: string
        action: string
        filterValue: string
      }
      if (
        !isValidCuratedPromoFilterClickPayload(
          {
            filterKey: candidate.filterKey as never,
            action: candidate.action as never,
            filterValue: candidate.filterValue,
          },
          filterVocabulary,
        )
      ) {
        return { ok: false, reason: 'invalid_payload' }
      }
      return {
        ok: true,
        name: eventName,
        payload: {
          filterKey: candidate.filterKey as never,
          action: candidate.action as never,
          filterValue: candidate.filterValue,
        },
      }
    }
    case 'curated_promo_card_open':
    case 'curated_promo_source_click': {
      const candidate = payload as { promoId: string }
      if (!isValidPromoIdPayload(candidate)) {
        return { ok: false, reason: 'invalid_payload' }
      }
      return { ok: true, name: eventName, payload: { promoId: candidate.promoId } }
    }
    case 'curated_promo_empty_state_view': {
      const candidate = payload as { reason: string }
      if (
        !isValidCuratedPromoEmptyStateViewPayload({
          reason: candidate.reason as never,
        })
      ) {
        return { ok: false, reason: 'invalid_payload' }
      }
      return {
        ok: true,
        name: eventName,
        payload: { reason: candidate.reason as never },
      }
    }
    case 'newsletter_subscribe_requested': {
      const candidate = payload as { signupSource: string }
      if (
        !isValidNewsletterSubscribeRequestedPayload({
          signupSource: candidate.signupSource as never,
        })
      ) {
        return { ok: false, reason: 'invalid_payload' }
      }
      return {
        ok: true,
        name: eventName,
        payload: { signupSource: candidate.signupSource as never },
      }
    }
  }
}
