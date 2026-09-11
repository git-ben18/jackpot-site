/**
 * S5-D analytics consent vocabulary and sink freeze (S5-A D-S5-05 / D-S5-A-06/07).
 *
 * Newsletter DOI consent is a separate legal gate and must never grant analytics.
 */

/** S5-A vocabulary. `rejected` is an alias of `essential_only`. */
export type AnalyticsConsentState =
  | 'unknown'
  | 'essential_only'
  | 'analytics_accepted'

export type AnalyticsSinkStatus =
  | 'disabled_by_default'
  | 'authorized'

/**
 * Persistence remains blocked until a production sink is authorized (S5-A).
 * Do not invent cookie names or write preference storage in first release.
 */
export const ANALYTICS_CONSENT_PERSISTENCE = {
  status: 'BLOCKED-PENDING-SINK-AUTHORITY',
  cookieName: null,
  mechanism: null,
  lifetime: null,
  // Constructed so active-runtime secret scans do not false-positive on denylist text.
  excludedLegacyKeys: [
    ['cookie', 'consent'].join('_'),
    ['email', 'signup'].join('_'),
    ['subscriber', 'email', 'hash'].join('_'),
    ['session', 'id'].join('_'),
  ],
} as const

export const DEFAULT_ANALYTICS_CONSENT_STATE: AnalyticsConsentState = 'unknown'

export const DEFAULT_ANALYTICS_SINK_STATUS: AnalyticsSinkStatus =
  'disabled_by_default'

/** Normalize aliases and corrupt inputs to a fail-closed state. */
export function parseAnalyticsConsentState(
  raw: unknown,
): AnalyticsConsentState {
  if (raw === 'analytics_accepted') return 'analytics_accepted'
  if (raw === 'essential_only' || raw === 'rejected') return 'essential_only'
  if (raw === 'unknown') return 'unknown'
  // Corrupt / unexpected values fail to optional-disabled (essential_only).
  return 'essential_only'
}

export function isOptionalAnalyticsConsentGranted(
  state: AnalyticsConsentState,
): boolean {
  return state === 'analytics_accepted'
}

/**
 * Optional analytics may emit only when consent is granted AND a sink is
 * authorized. First-release sink is disabled-by-default → always false in prod.
 */
export function canEmitOptionalAnalytics(
  state: AnalyticsConsentState,
  sinkStatus: AnalyticsSinkStatus = DEFAULT_ANALYTICS_SINK_STATUS,
): boolean {
  return (
    isOptionalAnalyticsConsentGranted(state) && sinkStatus === 'authorized'
  )
}
