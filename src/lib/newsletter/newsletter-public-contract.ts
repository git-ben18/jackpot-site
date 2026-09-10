/**
 * Browser-facing newsletter acquisition contract (S4-A freeze).
 * Safe to import from UI/client code. Must not import server transport/env.
 */
export const NEWSLETTER_CONSENT_POLICY_VERSION =
  'newsletter-consent-us-v1-2026-07-31' as const

export const NEWSLETTER_CHECK_EMAIL_COPY =
  'Check your email to confirm your subscription.' as const

export const BROWSER_SIGNUP_SOURCES = [
  'newsletter_landing',
  'website_footer',
] as const

export type BrowserSignupSource = (typeof BROWSER_SIGNUP_SOURCES)[number]

export const SUBSCRIBE_BROWSER_STATUSES = [
  'accepted',
  'invalid',
  'rate_limited',
  'unavailable',
] as const

export type SubscribeBrowserStatus = (typeof SUBSCRIBE_BROWSER_STATUSES)[number]

export const CONFIRM_VALIDATE_BROWSER_STATUSES = [
  'ready_to_confirm',
  'already_complete',
  'invalid_or_unusable',
  'unable_to_confirm',
] as const

export type ConfirmValidateBrowserStatus =
  (typeof CONFIRM_VALIDATE_BROWSER_STATUSES)[number]

export const CONFIRM_CONSUME_BROWSER_STATUSES = [
  'success',
  'already_complete',
  'invalid_or_unusable',
  'unable_to_confirm',
] as const

export type ConfirmConsumeBrowserStatus =
  (typeof CONFIRM_CONSUME_BROWSER_STATUSES)[number]

export type BrowserSubscribeRequest = {
  email: string
  consentAccepted: true
  ageConfirmed: true
  consentPolicyVersion: typeof NEWSLETTER_CONSENT_POLICY_VERSION
  signupSource: BrowserSignupSource
}

export type BrowserSubscribeResponse = {
  status: SubscribeBrowserStatus
}

export type BrowserConfirmTokenRequest = {
  token: string
}

export type BrowserConfirmValidateResponse = {
  status: ConfirmValidateBrowserStatus
}

export type BrowserConfirmConsumeResponse = {
  status: ConfirmConsumeBrowserStatus
}

export function isBrowserSignupSource(
  value: unknown,
): value is BrowserSignupSource {
  return (
    typeof value === 'string' &&
    (BROWSER_SIGNUP_SOURCES as readonly string[]).includes(value)
  )
}
