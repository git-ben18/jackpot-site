/**
 * Bounded confirmation UX copy for S4-E.
 * Product-safe visitor strings only — never render raw backend messages.
 */
export const NEWSLETTER_CONFIRM_COPY = {
  heading: 'Confirm subscription',
  loading: 'Checking your confirmation link…',
  confirming: 'Confirming your subscription…',
  prompt: 'Click below to confirm your newsletter subscription.',
  button: 'Confirm subscription',
  retryButton: 'Try again',
  success: 'Your subscription is confirmed.',
  alreadyComplete: 'This confirmation is already complete.',
  invalid: 'This confirmation link is invalid or no longer usable.',
  unable:
    'We were unable to confirm your subscription. You can try again, or come back later.',
} as const
