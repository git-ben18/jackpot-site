/**
 * S5-F typed/validated first-release telemetry seam.
 *
 * emitApprovedEvent(eventName, payload)
 *   -> validate event + payload (S5-E)
 *   -> check S5-D consent + sink
 *   -> call configured transport
 *   -> swallow/report bounded transport failure without affecting product action
 *
 * No legacy logging routes. No metadata bag. No arbitrary event names.
 */
import type { AnalyticsConsentController } from '../consent/analytics-consent-controller'
import {
  FIRST_RELEASE_TELEMETRY_CONTRACT,
  TELEMETRY_SCHEMA_VERSION,
  isFirstReleaseTelemetryEventName,
  isTelemetryEmptyPayload,
  isValidCuratedPromoEmptyStateViewPayload,
  isValidCuratedPromoFilterClickPayload,
  isValidNewsletterSubscribeRequestedPayload,
  isValidPromoIdPayload,
  type CuratedPromoFilterClickPayload,
  type FirstReleaseTelemetryEventName,
  type FirstReleaseTelemetryPayloadByEvent,
  type TelemetryFilterOptionVocabulary,
} from './first-release-telemetry-contract'
import type {
  FirstReleaseTelemetryEnvelope,
  FirstReleaseTelemetryTransport,
} from './first-release-telemetry-transport'

export type EmitApprovedEventOptions = {
  /** Required when emitting curated_promo_filter_click. */
  filterVocabulary?: TelemetryFilterOptionVocabulary
}

export type EmitApprovedEventResult =
  | { ok: true; emitted: true }
  | {
      ok: true
      emitted: false
      reason: 'consent_not_granted' | 'sink_disabled'
    }
  | {
      ok: false
      emitted: false
      reason: 'unknown_event' | 'invalid_payload' | 'transport_failed'
    }

export type FirstReleaseTelemetrySeam = {
  emitApprovedEvent: <N extends FirstReleaseTelemetryEventName>(
    eventName: N,
    payload: FirstReleaseTelemetryPayloadByEvent[N] | Record<string, unknown>,
    options?: EmitApprovedEventOptions,
  ) => EmitApprovedEventResult
  getConsent: () => AnalyticsConsentController
  getTransportKind: () => FirstReleaseTelemetryTransport['kind']
}

export type CreateFirstReleaseTelemetrySeamOptions = {
  consent: AnalyticsConsentController
  transport: FirstReleaseTelemetryTransport
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stripToKeys(
  raw: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      out[key] = raw[key]
    }
  }
  return out
}

function validateAndNormalizePayload<N extends FirstReleaseTelemetryEventName>(
  eventName: N,
  raw: unknown,
  options: EmitApprovedEventOptions | undefined,
): FirstReleaseTelemetryPayloadByEvent[N] | null {
  if (!isPlainObject(raw)) return null

  const allowed =
    FIRST_RELEASE_TELEMETRY_CONTRACT[eventName].allowedPayloadKeys
  const stripped = stripToKeys(raw, allowed as readonly string[])

  switch (eventName) {
    case 'curated_promo_discovery_view':
    case 'newsletter_subscription_confirmed': {
      if (!isTelemetryEmptyPayload(stripped)) return null
      return stripped as FirstReleaseTelemetryPayloadByEvent[N]
    }
    case 'curated_promo_filter_click': {
      const candidate = stripped as Partial<CuratedPromoFilterClickPayload>
      if (
        typeof candidate.filterKey !== 'string' ||
        typeof candidate.action !== 'string' ||
        typeof candidate.filterValue !== 'string'
      ) {
        return null
      }
      const payload: CuratedPromoFilterClickPayload = {
        filterKey: candidate.filterKey as CuratedPromoFilterClickPayload['filterKey'],
        action: candidate.action as CuratedPromoFilterClickPayload['action'],
        filterValue: candidate.filterValue,
      }
      if (!options?.filterVocabulary) return null
      if (
        !isValidCuratedPromoFilterClickPayload(payload, options.filterVocabulary)
      ) {
        return null
      }
      return payload as FirstReleaseTelemetryPayloadByEvent[N]
    }
    case 'curated_promo_card_open':
    case 'curated_promo_source_click': {
      if (typeof stripped.promoId !== 'string') return null
      const payload = { promoId: stripped.promoId }
      if (!isValidPromoIdPayload(payload)) return null
      return payload as FirstReleaseTelemetryPayloadByEvent[N]
    }
    case 'curated_promo_empty_state_view': {
      if (typeof stripped.reason !== 'string') return null
      const payload = {
        reason: stripped.reason as FirstReleaseTelemetryPayloadByEvent['curated_promo_empty_state_view']['reason'],
      }
      if (!isValidCuratedPromoEmptyStateViewPayload(payload)) return null
      return payload as FirstReleaseTelemetryPayloadByEvent[N]
    }
    case 'newsletter_subscribe_requested': {
      if (typeof stripped.signupSource !== 'string') return null
      const payload = {
        signupSource:
          stripped.signupSource as FirstReleaseTelemetryPayloadByEvent['newsletter_subscribe_requested']['signupSource'],
      }
      if (!isValidNewsletterSubscribeRequestedPayload(payload)) return null
      return payload as FirstReleaseTelemetryPayloadByEvent[N]
    }
    default:
      return null
  }
}

export function createFirstReleaseTelemetrySeam(
  options: CreateFirstReleaseTelemetrySeamOptions,
): FirstReleaseTelemetrySeam {
  const { consent, transport } = options

  return {
    getConsent: () => consent,
    getTransportKind: () => transport.kind,
    emitApprovedEvent(eventName, payload, emitOptions) {
      if (
        typeof eventName !== 'string' ||
        !isFirstReleaseTelemetryEventName(eventName)
      ) {
        return { ok: false, emitted: false, reason: 'unknown_event' }
      }

      const normalized = validateAndNormalizePayload(
        eventName,
        payload,
        emitOptions,
      )
      if (!normalized) {
        return { ok: false, emitted: false, reason: 'invalid_payload' }
      }

      if (!consent.canEmitOptionalAnalytics()) {
        return {
          ok: true,
          emitted: false,
          reason:
            consent.getSinkStatus() !== 'authorized'
              ? 'sink_disabled'
              : 'consent_not_granted',
        }
      }

      const envelope: FirstReleaseTelemetryEnvelope = {
        name: eventName,
        schemaVersion: TELEMETRY_SCHEMA_VERSION,
        payload: normalized,
      }

      try {
        const maybePromise = transport.send(envelope)
        if (
          maybePromise &&
          typeof (maybePromise as Promise<void>).then === 'function'
        ) {
          void (maybePromise as Promise<void>).catch(() => {
            /* swallow async transport failure — never affect product */
          })
        }
        return { ok: true, emitted: true }
      } catch {
        // Bound failure: do not surface transport error bodies/secrets.
        return { ok: false, emitted: false, reason: 'transport_failed' }
      }
    },
  }
}
