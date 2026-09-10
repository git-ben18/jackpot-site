/**
 * Abuse-control policy for newsletter acquisition (S4-F).
 *
 * Safe to import from docs/tests/UI. Does not implement provider verification.
 * Browser-only checks are never authoritative for enabling public acquisition.
 */
export const NEWSLETTER_ABUSE_CONTROL_POLICY = {
  /**
   * Approved honeypot field on the browser subscribe DTO.
   * Server BFF short-circuits filled values without upstream mutation.
   */
  honeypot: {
    browserField: 'website' as const,
    authoritativeAt: 'server_bff' as const,
  },
  /**
   * Turnstile (or equivalent) is intentionally not accepted on the browser DTO.
   * Hosted Acceptance / release must decide provider wiring; do not invent it here.
   */
  botChallenge: {
    status: 'deferred_hosted_acceptance' as const,
    browserFieldsAccepted: [] as const,
    forwardToNewsletterService: false,
  },
  browserOnlyChecksAuthoritative: false,
  notes: [
    'Retain server-authoritative honeypot short-circuit.',
    'Do not enable public acquisition solely because client validation exists.',
    'Do not forward turnstileToken or similar unapproved fields upstream.',
  ],
} as const

export type NewsletterAbuseControlPolicy = typeof NEWSLETTER_ABUSE_CONTROL_POLICY
