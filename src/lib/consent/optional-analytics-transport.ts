/**
 * S5-D consent-gated emitter/spy seam.
 *
 * Consent gate only: no named events, no payload schemas, no field
 * allow/deny lists. S5-E/F supply the event type and payload rules.
 */
import type { AnalyticsConsentController } from './analytics-consent-controller'

export type ConsentGatedEmitResult =
  | { emitted: true }
  | { emitted: false; reason: 'sink_disabled' | 'consent_not_granted' }

export type ConsentGatedEmitter<TEvent> = {
  emit: (event: TEvent) => ConsentGatedEmitResult
  getEmitted: () => TEvent[]
  clear: () => void
}

/**
 * Generic consent + sink gate. Callers (tests / later S5-F) choose `TEvent`.
 * Does not inspect, validate, or transform the event value.
 */
export function createConsentGatedEmitter<TEvent>(
  consent: AnalyticsConsentController,
): ConsentGatedEmitter<TEvent> {
  const emitted: TEvent[] = []

  return {
    emit(event) {
      if (!consent.canEmitOptionalAnalytics()) {
        return {
          emitted: false,
          reason:
            consent.getSinkStatus() !== 'authorized'
              ? 'sink_disabled'
              : 'consent_not_granted',
        }
      }
      emitted.push(event)
      return { emitted: true }
    },
    getEmitted: () => [...emitted],
    clear() {
      emitted.length = 0
    },
  }
}

/** @deprecated Prefer createConsentGatedEmitter — kept as a stable S5-D export alias. */
export const createGatedOptionalAnalyticsTransport = createConsentGatedEmitter
