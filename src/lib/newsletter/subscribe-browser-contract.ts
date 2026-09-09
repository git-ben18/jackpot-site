import {
  BROWSER_SIGNUP_SOURCES,
  CONSENT_POLICY_VERSION,
  type BrowserSignupSource,
} from "./doi-constants";

export type NewsletterSubscribeBrowserStatus =
  | "accepted"
  | "rate_limited"
  | "unavailable"
  | "error";

export type NewsletterSubscribeBrowserRequest = {
  email: string;
  consentAccepted: boolean;
  ageConfirmed: boolean;
  consentPolicyVersion: string;
  signupSource: BrowserSignupSource;
  /** Honeypot — must be empty when present. */
  website?: string;
};

export type NewsletterSubscribeBrowserResponse = {
  status: NewsletterSubscribeBrowserStatus;
};

const EMAIL_MAX = 320;
const BASIC_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeValidationIssue =
  | "invalid_email"
  | "missing_consent"
  | "missing_age"
  | "invalid_policy_version"
  | "invalid_signup_source"
  | "honeypot_tripped";

export type SubscribeValidationResult =
  | { ok: true; value: NewsletterSubscribeBrowserRequest }
  | { ok: false; issue: SubscribeValidationIssue };

export function isBrowserSignupSource(
  value: unknown,
): value is BrowserSignupSource {
  return (
    typeof value === "string" &&
    (BROWSER_SIGNUP_SOURCES as readonly string[]).includes(value)
  );
}

export function isNewsletterSubscribeBrowserStatus(
  value: unknown,
): value is NewsletterSubscribeBrowserStatus {
  return (
    value === "accepted" ||
    value === "rate_limited" ||
    value === "unavailable" ||
    value === "error"
  );
}

/**
 * Validate and allowlist browser subscribe fields before any network call.
 */
export function validateSubscribeBrowserInput(input: {
  email: unknown;
  consentAccepted: unknown;
  ageConfirmed: unknown;
  consentPolicyVersion?: unknown;
  signupSource: unknown;
  website?: unknown;
}): SubscribeValidationResult {
  const website =
    typeof input.website === "string" ? input.website.trim() : "";
  if (website.length > 0) {
    return { ok: false, issue: "honeypot_tripped" };
  }

  if (input.consentAccepted !== true) {
    return { ok: false, issue: "missing_consent" };
  }

  if (input.ageConfirmed !== true) {
    return { ok: false, issue: "missing_age" };
  }

  const policyVersion =
    typeof input.consentPolicyVersion === "string"
      ? input.consentPolicyVersion
      : CONSENT_POLICY_VERSION;
  if (policyVersion !== CONSENT_POLICY_VERSION) {
    return { ok: false, issue: "invalid_policy_version" };
  }

  if (!isBrowserSignupSource(input.signupSource)) {
    return { ok: false, issue: "invalid_signup_source" };
  }

  const email =
    typeof input.email === "string" ? input.email.trim() : "";
  if (
    email.length === 0 ||
    email.length > EMAIL_MAX ||
    !BASIC_EMAIL.test(email)
  ) {
    return { ok: false, issue: "invalid_email" };
  }

  return {
    ok: true,
    value: {
      email,
      consentAccepted: true,
      ageConfirmed: true,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      signupSource: input.signupSource,
      website: "",
    },
  };
}

/**
 * Parse the narrow browser-safe BFF response. Arbitrary 2xx JSON is not success.
 */
export function parseSubscribeBrowserResponse(
  payload: unknown,
): NewsletterSubscribeBrowserResponse {
  if (
    payload &&
    typeof payload === "object" &&
    "status" in payload &&
    isNewsletterSubscribeBrowserStatus(
      (payload as { status: unknown }).status,
    )
  ) {
    return { status: (payload as { status: NewsletterSubscribeBrowserStatus }).status };
  }

  return { status: "error" };
}
