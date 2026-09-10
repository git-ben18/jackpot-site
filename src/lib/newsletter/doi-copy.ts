/**
 * Product-owned DOI acquisition copy (EC-05A / S4-A freeze).
 * Do not copy source doi-constants version strings or JackpotHomie legacy wording.
 */
import { NEWSLETTER_CHECK_EMAIL_COPY } from './newsletter-public-contract'

export const NEWSLETTER_DOI_COPY = {
  heroHeading: 'Jackpot Homie',
  heroSupport:
    'Get curated casino promotion and event information by email. Confirm your address to finish signing up.',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  consentLabel:
    'I agree to receive the Jackpot Homie email newsletter with curated casino promotion and event information. Emails are generally sent weekly, with occasional additional updates. I can unsubscribe at any time. See the Privacy Policy.',
  ageLabel: 'I confirm that I am 21 years of age or older.',
  submit: 'Subscribe',
  submitting: 'Submitting…',
  accepted: NEWSLETTER_CHECK_EMAIL_COPY,
  invalid:
    'Please check your email, consent, and age confirmation, then try again.',
  rateLimited: 'Too many attempts right now. Please wait a bit and try again.',
  unavailable:
    'Newsletter signup is temporarily unavailable. Please try again later.',
  missingEmail: 'Enter a valid email address.',
  missingConsent: 'Confirm you agree to receive the newsletter.',
  missingAge: 'Confirm that you are 21 or older.',
} as const
