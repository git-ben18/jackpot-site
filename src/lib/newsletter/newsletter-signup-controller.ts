import { isNewsletterDoiAcquisitionEnabled } from "./acquisition-kill-switch";
import { NEWSLETTER_COPY, type BrowserSignupSource } from "./doi-constants";
import { subscribeNewsletter } from "./subscribe-client";
import {
  validateSubscribeBrowserInput,
  type NewsletterSubscribeBrowserStatus,
  type SubscribeValidationIssue,
} from "./subscribe-browser-contract";

export type NewsletterSignupUiState =
  | "idle"
  | "validating"
  | "submitting"
  | "accepted"
  | "rate_limited"
  | "unavailable"
  | "error";

export type NewsletterSignupFormValues = {
  email: string;
  consentAccepted: boolean;
  ageConfirmed: boolean;
  website: string;
};

export type NewsletterSignupControllerSnapshot = {
  state: NewsletterSignupUiState;
  values: NewsletterSignupFormValues;
  fieldError: string | null;
  statusMessage: string | null;
  inFlight: boolean;
};

export type NewsletterSignupControllerOptions = {
  signupSource: BrowserSignupSource;
  enabled?: boolean;
  subscribe?: typeof subscribeNewsletter;
};

function messageForIssue(issue: SubscribeValidationIssue): string {
  switch (issue) {
    case "invalid_email":
      return NEWSLETTER_COPY.invalidEmailMessage;
    case "missing_consent":
      return NEWSLETTER_COPY.missingConsentMessage;
    case "missing_age":
      return NEWSLETTER_COPY.missingAgeMessage;
    case "honeypot_tripped":
      // Treat as generic accepted to avoid teaching bots; no network call.
      return NEWSLETTER_COPY.acceptedMessage;
    default:
      return NEWSLETTER_COPY.errorMessage;
  }
}

function messageForStatus(
  status: NewsletterSubscribeBrowserStatus,
): string {
  switch (status) {
    case "accepted":
      return NEWSLETTER_COPY.acceptedMessage;
    case "rate_limited":
      return NEWSLETTER_COPY.rateLimitedMessage;
    case "unavailable":
      return NEWSLETTER_COPY.unavailableMessage;
    case "error":
    default:
      return NEWSLETTER_COPY.errorMessage;
  }
}

/**
 * Pure-ish controller for DOI signup UX. Extracted so behavior tests do not
 * need a DOM environment.
 */
export function createNewsletterSignupController(
  options: NewsletterSignupControllerOptions,
) {
  const enabled =
    options.enabled ?? isNewsletterDoiAcquisitionEnabled();
  const subscribe = options.subscribe ?? subscribeNewsletter;

  let state: NewsletterSignupUiState = enabled ? "idle" : "unavailable";
  let values: NewsletterSignupFormValues = {
    email: "",
    consentAccepted: false,
    ageConfirmed: false,
    website: "",
  };
  let fieldError: string | null = null;
  let statusMessage: string | null = enabled
    ? null
    : NEWSLETTER_COPY.unavailableMessage;
  let inFlight = false;
  let submitGeneration = 0;

  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) {
      listener();
    }
  }

  function snapshot(): NewsletterSignupControllerSnapshot {
    return {
      state,
      values: { ...values },
      fieldError,
      statusMessage,
      inFlight,
    };
  }

  function setValues(patch: Partial<NewsletterSignupFormValues>) {
    values = { ...values, ...patch };
    if (state === "error" || fieldError) {
      fieldError = null;
      if (state === "error") {
        state = "idle";
        statusMessage = null;
      }
    }
    emit();
  }

  async function submit(): Promise<NewsletterSignupControllerSnapshot> {
    if (!enabled) {
      state = "unavailable";
      statusMessage = NEWSLETTER_COPY.unavailableMessage;
      fieldError = null;
      emit();
      return snapshot();
    }

    if (inFlight) {
      return snapshot();
    }

    state = "validating";
    fieldError = null;
    statusMessage = null;
    emit();

    const validated = validateSubscribeBrowserInput({
      email: values.email,
      consentAccepted: values.consentAccepted,
      ageConfirmed: values.ageConfirmed,
      signupSource: options.signupSource,
      website: values.website,
    });

    if (!validated.ok) {
      if (validated.issue === "honeypot_tripped") {
        state = "accepted";
        statusMessage = NEWSLETTER_COPY.acceptedMessage;
        fieldError = null;
        emit();
        return snapshot();
      }

      state = "idle";
      fieldError = messageForIssue(validated.issue);
      emit();
      return snapshot();
    }

    inFlight = true;
    state = "submitting";
    const generation = ++submitGeneration;
    emit();

    const result = await subscribe(validated.value);

    if (generation !== submitGeneration) {
      return snapshot();
    }

    inFlight = false;
    state = result.status;
    statusMessage = messageForStatus(result.status);
    fieldError = null;
    emit();
    return snapshot();
  }

  return {
    getSnapshot: snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setValues,
    submit,
    isEnabled: () => enabled,
  };
}

export type NewsletterSignupController = ReturnType<
  typeof createNewsletterSignupController
>;
