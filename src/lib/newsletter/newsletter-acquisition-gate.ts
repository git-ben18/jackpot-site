/**
 * Server-authoritative newsletter acquisition gate (S4-F).
 *
 * Replaces the excluded source acquisition-flag module. When disabled, BFF
 * handlers must not call the newsletter service and must never fall back to a
 * legacy subscribe writer or dual canonical subscriber path.
 *
 * Public acquisition enablement remains a Hosted Acceptance / release gate even
 * when this switch is locally enabled for development.
 */
import 'server-only'

export type NewsletterAcquisitionGateDecision =
  | { allowed: true }
  | { allowed: false; reason: 'kill_switch' }

const ENABLED_VALUES = new Set(['1', 'true', 'on', 'enabled', 'yes'])
const DISABLED_VALUES = new Set(['0', 'false', 'off', 'disabled', 'no'])

/**
 * Env: `NEWSLETTER_ACQUISITION_ENABLED`
 * - unset / empty → allowed (local default; not a production launch claim)
 * - true-like → allowed
 * - false-like or unknown → kill switch (fail closed)
 */
export function resolveNewsletterAcquisitionGate(
  env: Record<string, string | undefined> = process.env,
): NewsletterAcquisitionGateDecision {
  const raw = env.NEWSLETTER_ACQUISITION_ENABLED
  if (raw === undefined || raw.trim() === '') {
    return { allowed: true }
  }
  const normalized = raw.trim().toLowerCase()
  if (ENABLED_VALUES.has(normalized)) {
    return { allowed: true }
  }
  if (DISABLED_VALUES.has(normalized)) {
    return { allowed: false, reason: 'kill_switch' }
  }
  return { allowed: false, reason: 'kill_switch' }
}

export function isNewsletterAcquisitionEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return resolveNewsletterAcquisitionGate(env).allowed
}
