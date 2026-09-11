/**
 * Narrow S5-D analytics-consent controller.
 * In-memory only while persistence is BLOCKED-PENDING-SINK-AUTHORITY.
 * No pre-consent event queue. No email/token/session storage.
 */
import {
  canEmitOptionalAnalytics,
  DEFAULT_ANALYTICS_CONSENT_STATE,
  DEFAULT_ANALYTICS_SINK_STATUS,
  isOptionalAnalyticsConsentGranted,
  parseAnalyticsConsentState,
  type AnalyticsConsentState,
  type AnalyticsSinkStatus,
} from './analytics-consent'

export type AnalyticsConsentController = {
  getState: () => AnalyticsConsentState
  getSinkStatus: () => AnalyticsSinkStatus
  isOptionalConsentGranted: () => boolean
  canEmitOptionalAnalytics: () => boolean
  acceptAnalytics: () => void
  rejectOptionalAnalytics: () => void
  revokeAnalytics: () => void
  /** Test/future seam only — rejects writing when persistence is blocked. */
  persistPreference: () => { ok: false; reason: 'persistence_blocked' }
  /** Apply an untrusted stored raw value (fail-closed). Does not write storage. */
  hydrateFromUntrustedRaw: (raw: unknown) => AnalyticsConsentState
  subscribe: (listener: () => void) => () => void
}

export type CreateAnalyticsConsentControllerOptions = {
  initialState?: AnalyticsConsentState
  /** Inject only in tests; production remains disabled_by_default. */
  sinkStatus?: AnalyticsSinkStatus
}

export function createAnalyticsConsentController(
  options: CreateAnalyticsConsentControllerOptions = {},
): AnalyticsConsentController {
  let state: AnalyticsConsentState =
    options.initialState ?? DEFAULT_ANALYTICS_CONSENT_STATE
  const sinkStatus: AnalyticsSinkStatus =
    options.sinkStatus ?? DEFAULT_ANALYTICS_SINK_STATUS
  const listeners = new Set<() => void>()

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function setState(next: AnalyticsConsentState): void {
    if (next === state) return
    state = next
    notify()
  }

  return {
    getState: () => state,
    getSinkStatus: () => sinkStatus,
    isOptionalConsentGranted: () => isOptionalAnalyticsConsentGranted(state),
    canEmitOptionalAnalytics: () => canEmitOptionalAnalytics(state, sinkStatus),
    acceptAnalytics() {
      setState('analytics_accepted')
    },
    rejectOptionalAnalytics() {
      setState('essential_only')
    },
    revokeAnalytics() {
      setState('essential_only')
    },
    persistPreference() {
      return { ok: false, reason: 'persistence_blocked' }
    },
    hydrateFromUntrustedRaw(raw) {
      const next = parseAnalyticsConsentState(raw)
      setState(next)
      return next
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
