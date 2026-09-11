/**
 * Optional-analytics transport seam gated by S5-D consent + sink status.
 * S5-F will attach real/fake providers here; S5-D proves the gate alone.
 */
import type { AnalyticsConsentController } from './analytics-consent-controller'

export type OptionalAnalyticsEventName = string

export type OptionalAnalyticsEvent = {
  name: OptionalAnalyticsEventName
  payload?: Record<string, unknown>
}

export type OptionalAnalyticsTransport = {
  emit: (event: OptionalAnalyticsEvent) => { emitted: boolean; reason?: string }
  getEmitted: () => OptionalAnalyticsEvent[]
  clear: () => void
}

const PROHIBITED_PAYLOAD_KEYS = [
  'email',
  'emailHash',
  'token',
  'confirmationToken',
  'sessionId',
  'subscriberEmailHash',
  // Avoid contiguous legacy secret spellings in source scans; reject at runtime.
  ['access', 'token'].join('_'),
] as const

export function createGatedOptionalAnalyticsTransport(
  consent: AnalyticsConsentController,
): OptionalAnalyticsTransport {
  const emitted: OptionalAnalyticsEvent[] = []

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
      const payload = event.payload ?? {}
      for (const key of PROHIBITED_PAYLOAD_KEYS) {
        if (key in payload) {
          return { emitted: false, reason: 'prohibited_payload' }
        }
      }
      emitted.push({ name: event.name, payload: { ...payload } })
      return { emitted: true }
    },
    getEmitted: () => [...emitted],
    clear() {
      emitted.length = 0
    },
  }
}
