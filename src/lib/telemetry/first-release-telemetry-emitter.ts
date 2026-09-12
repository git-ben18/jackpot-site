/**
 * S5-F typed fail-soft telemetry seam.
 *
 * emitApprovedEvent → validate S5-E name/payload → S5-D consent/sink gate
 * → configured transport → swallow failures (never change product UX).
 *
 * Public API is typed to FirstReleaseTelemetryEventName + correlated payload.
 * Runtime validation remains defense-in-depth for untrusted/cast inputs.
 *
 * Once/dedupe is owned by widget/controller lifetimes — not this emitter.
 *
 * REIMPLEMENT — do not copy source tracker hooks, session-init modules, or
 * log-* routes.
 */
import { createAnalyticsConsentController } from '../consent/analytics-consent-controller'
import type { AnalyticsConsentController } from '../consent/analytics-consent-controller'
import {
  TELEMETRY_SCHEMA_VERSION,
  type FirstReleaseTelemetryEnvelope,
  type FirstReleaseTelemetryEventName,
  type FirstReleaseTelemetryPayloadByEvent,
  type TelemetryFilterOptionVocabulary,
} from './first-release-telemetry-contract'
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
  | 'transport_failed'

export type EmitApprovedEventResult =
  | { ok: true; emitted: true }
  | { ok: false; emitted: false; reason: EmitApprovedEventReason }

export type EmitApprovedEventOptions = {
  filterVocabulary?: TelemetryFilterOptionVocabulary
}

export type EmitApprovedEvent = {
  (
    eventName: 'curated_promo_filter_click',
    payload: FirstReleaseTelemetryPayloadByEvent['curated_promo_filter_click'],
    options: { filterVocabulary: TelemetryFilterOptionVocabulary },
  ): EmitApprovedEventResult
  <N extends Exclude<FirstReleaseTelemetryEventName, 'curated_promo_filter_click'>>(
    eventName: N,
    payload: FirstReleaseTelemetryPayloadByEvent[N],
    options?: EmitApprovedEventOptions,
  ): EmitApprovedEventResult
}

export type FirstReleaseTelemetryEmitter = {
  emitApprovedEvent: EmitApprovedEvent
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

function toEnvelope(
  validated: Extract<
    ReturnType<typeof validateFirstReleaseTelemetryPayload>,
    { ok: true }
  >,
): FirstReleaseTelemetryEnvelope {
  return {
    name: validated.name,
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    payload: validated.payload,
  } as FirstReleaseTelemetryEnvelope
}

/**
 * Runtime emit path. Product callers use the typed `emitApprovedEvent`.
 * Tests may call this to prove defense-in-depth against untrusted names/payloads.
 */
export function emitUntrustedFirstReleaseTelemetry(
  deps: Pick<CreateFirstReleaseTelemetryEmitterDeps, 'consent' | 'transport'>,
  eventName: string,
  payload: unknown,
  options: EmitApprovedEventOptions = {},
): EmitApprovedEventResult {
  try {
    const validated = validateFirstReleaseTelemetryPayload(
      eventName,
      payload,
      options.filterVocabulary,
    )
    if (!validated.ok) {
      return { ok: false, emitted: false, reason: validated.reason }
    }

    if (!deps.consent.canEmitOptionalAnalytics()) {
      return {
        ok: false,
        emitted: false,
        reason: consentDenyReason(deps.consent),
      }
    }

    try {
      const maybePromise = deps.transport.send(toEnvelope(validated))
      if (maybePromise && typeof maybePromise.then === 'function') {
        void maybePromise.catch(() => {
          // Swallow async transport failure; do not rethrow into product.
        })
      }
    } catch {
      return { ok: false, emitted: false, reason: 'transport_failed' }
    }

    return { ok: true, emitted: true }
  } catch {
    return { ok: false, emitted: false, reason: 'transport_failed' }
  }
}

export function createFirstReleaseTelemetryEmitter(
  deps: CreateFirstReleaseTelemetryEmitterDeps,
): FirstReleaseTelemetryEmitter {
  const emitApprovedEvent = ((
    eventName: FirstReleaseTelemetryEventName,
    payload: FirstReleaseTelemetryPayloadByEvent[FirstReleaseTelemetryEventName],
    options: EmitApprovedEventOptions = {},
  ) =>
    emitUntrustedFirstReleaseTelemetry(
      deps,
      eventName,
      payload,
      options,
    )) as EmitApprovedEvent

  return {
    getTransportKind: () => deps.transport.kind,
    emitApprovedEvent,
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
  eventName: 'curated_promo_filter_click',
  payload: FirstReleaseTelemetryPayloadByEvent['curated_promo_filter_click'],
  options: { filterVocabulary: TelemetryFilterOptionVocabulary },
): void
export function emitApprovedEventFailSoft<
  N extends Exclude<FirstReleaseTelemetryEventName, 'curated_promo_filter_click'>,
>(
  telemetry: FirstReleaseTelemetryEmitter,
  eventName: N,
  payload: FirstReleaseTelemetryPayloadByEvent[N],
  options?: EmitApprovedEventOptions,
): void
export function emitApprovedEventFailSoft(
  telemetry: FirstReleaseTelemetryEmitter,
  eventName: FirstReleaseTelemetryEventName,
  payload: FirstReleaseTelemetryPayloadByEvent[FirstReleaseTelemetryEventName],
  options?: EmitApprovedEventOptions,
): void {
  try {
    ;(
      telemetry.emitApprovedEvent as (
        name: FirstReleaseTelemetryEventName,
        eventPayload: FirstReleaseTelemetryPayloadByEvent[FirstReleaseTelemetryEventName],
        eventOptions?: EmitApprovedEventOptions,
      ) => EmitApprovedEventResult
    )(eventName, payload, options)
  } catch {
    // Emitter is specified never to throw; this is belt-and-suspenders.
  }
}
