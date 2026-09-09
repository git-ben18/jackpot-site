/**
 * Provisional DOI product/constants seam.
 *
 * Product authority (EC-05A) and live newsletter-service vocabulary were not
 * readable at S4-A. Values here are allowlisted for the target browser/BFF
 * seam and must be re-verified before hosted acceptance.
 */

export const CONSENT_POLICY_VERSION = "jh-newsletter-consent-v1";

/** Public UI may only emit these signup sources. */
export const BROWSER_SIGNUP_SOURCES = [
  "newsletter_landing",
  "website_footer",
] as const;

export type BrowserSignupSource = (typeof BROWSER_SIGNUP_SOURCES)[number];

export const DEFAULT_HOMEPAGE_SIGNUP_SOURCE: BrowserSignupSource =
  "newsletter_landing";

/** Same-origin BFF path — never a newsletter-service hostname. */
export const NEWSLETTER_SUBSCRIBE_BFF_PATH = "/api/newsletter/subscribe";

/**
 * Opt-in acquisition kill switch.
 * Public DOI remains disabled unless explicitly set to "true".
 */
export const NEWSLETTER_DOI_ENABLED_ENV = "NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED";

export const NEWSLETTER_COPY = {
  heroBrandEyebrow: "Jackpot Homie",
  heroHeadline: "Get the offers worth chasing",
  heroSupport:
    "Join the newsletter for curated promos. Confirm by email before anything is activated.",
  emailLabel: "Email address",
  consentLabel:
    "I want to receive the Jackpot Homie newsletter and understand I can unsubscribe anytime.",
  ageLabel: "I confirm I am 21 years of age or older.",
  submitLabel: "Subscribe",
  submittingLabel: "Submitting…",
  acceptedMessage:
    "If this address is eligible, you will receive a confirmation email shortly. Check your inbox to finish signing up.",
  rateLimitedMessage:
    "Please wait a bit before trying again. If eligible, you may already have a confirmation email on the way.",
  unavailableMessage:
    "Newsletter signup is temporarily unavailable. Please try again later.",
  errorMessage:
    "Something went wrong. Please check your details and try again.",
  invalidEmailMessage: "Enter a valid email address.",
  missingConsentMessage: "Confirm newsletter consent to continue.",
  missingAgeMessage: "Confirm you are 21 or older to continue.",
} as const;
