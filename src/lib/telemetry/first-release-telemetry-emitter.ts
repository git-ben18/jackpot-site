/**
 * S5-F typed fail-soft telemetry seam.
 *
 * emitApprovedEvent → validate S5-E name/payload → S5-D consent/sink gate
 * → configured transport → swallow failures (never change product UX).
 *
 * REIMPLEMENT — do not copy source tracker hooks, session-init modules, or
 * log-* routes.
 */
import { createAnalyticsConsentController } from '../consent/analytics-consent-controller'
import type { AnalyticsConsentController } from '../consent/analytics-consent-controller'
import { TELEMETRY_SCHEMA_VERSION } from './first-release-telemetry-contract'
import type { TelemetryFilterOptionVocabulary } from './first-release-telemetry-contract'
import {
  createDisabledTelemetryTransport,
  type FirstReleaseTelemetryTransport,
  type FirstReleaseTelemetryTransportKind,
} from './first-release-telemetry-transport'
import { validateFirstReleaseTelemetryPayload } from './first-release-telemetry-validate'

export type EmitApprovedEventReason =
  | 'unknown_event'
  | 'invalid_payload'
  | 'consent_not_granted'
  | 'sink_disabled'
  | 'deduped'
  | 'transport_failed'

export type EmitApprovedEventResult =
  | { ok: true; emitted: true }
  | { ok: true; emitted: false; reason: 'deduped' }
  | { ok: false; emitted: false; reason: Exclude<EmitApprovedEventReason, 'deduped'> }

export type EmitApprovedEventOptions = {
  onceKey?: string
  filterVocabulary?: TelemetryFilterOptionVocabulary
}

export type FirstReleaseTelemetryEmitter = {
  emitApprovedEvent: (
    eventName: string,
    payload: unknown,
    options?: EmitApprovedEventOptions,
  ) => EmitApprovedEventResult
  getTransportKind: () => FirstReleaseTelemetryTransportKind
}

export type CreateFirstReleaseTelemetryEmitterDeps = {
  consent: AnalyticsConsentController
  transport: FirstReleaseTelemetryTransport
}

function consentDenyReason(
  consent: AnalyticsConsentController,
): 'sink_disabled' | 'consent_not_granted' {
  return consent.getSinkStatus() !== 'authorized'
    ? 'sink_disabled'
    : 'consent_not_granted'
}

export function createFirstReleaseTelemetryEmitter(
  deps: CreateFirstReleaseTelemetryEmitterDeps,
): FirstReleaseTelemetryEmitter {
  const onceKeys = new Set<string>()

  return {
    getTransportKind: () => deps.transport.kind,
    emitApprovedEvent(eventName, payload, options = {}) {
      try {
        const validated = validateFirstReleaseTelemetryPayload(
          eventName,
          payload,
          options.filterVocabulary,
        )
        if (!validated.ok) {
          return { ok: false, emitted: false, reason: validated.reason }
        }

        if (options.onceKey && onceKeys.has(options.onceKey)) {
          return { ok: true, emitted: false, reason: 'deduped' }
        }

        // Consume once-keys for valid events even when gated, so pre-consent
        // views are never replayed after a later accept (S5-F: no replay cache).
        if (options.onceKey) {
          onceKeys.add(options.onceKey)
        }

        if (!deps.consent.canEmitOptionalAnalytics()) {
          return {
            ok: false,
            emitted: false,
            reason: consentDenyReason(deps.consent),
          }
        }

        try {
          const maybePromise = deps.transport.send({
            name: validated.name,
            schemaVersion: TELEMETRY_SCHEMA_VERSION,
            payload: validated.payload,
          })
          if (maybePromise && typeof maybePromise.then === 'function') {
            void maybePromise.catch(() => {
              // Swallow async transport failure; do not rethrow into product.
            })
          }
        } catch {
          if (options.onceKey) {
            onceKeys.delete(options.onceKey)
          }
          return { ok: false, emitted: false, reason: 'transport_failed' }
        }

        return { ok: true, emitted: true }
      } catch {
        return { ok: false, emitted: false, reason: 'transport_failed' }
      }
    },
  }
}

let defaultEmitter: FirstReleaseTelemetryEmitter | undefined

/** Production default: unknown consent + explicit disabled transport. */
export function getDefaultFirstReleaseTelemetry(): FirstReleaseTelemetryEmitter {
  if (!defaultEmitter) {
    defaultEmitter = createFirstReleaseTelemetryEmitter({
      consent: createAnalyticsConsentController(),
      transport: createDisabledTelemetryTransport(),
    })
  }
  return defaultEmitter
}

/** Test-only: drop the process-wide default so isolated cases can rebuild it. */
export function resetDefaultFirstReleaseTelemetryForTests(): void {
  defaultEmitter = undefined
}

/**
 * Fire-and-forget wrapper for product callers. Never throws.
 * Product phase/UX must already be committed before this is invoked.
 */
export function emitApprovedEventFailSoft(
  telemetry: FirstReleaseTelemetryEmitter,
  eventName: string,
  payload: unknown,
  options?: EmitApprovedEventOptions,
): void {
  try {
    telemetry.emitApprovedEvent(eventName, payload, options)
  } catch {
    // Emitter is specified never to throw; this is belt-and-suspenders.
  }
}
