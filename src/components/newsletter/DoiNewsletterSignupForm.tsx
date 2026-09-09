"use client";

import React, { useEffect, useState } from "react";

import {
  createNewsletterSignupController,
  type NewsletterSignupController,
} from "@/lib/newsletter/newsletter-signup-controller";
import {
  NEWSLETTER_COPY,
  type BrowserSignupSource,
} from "@/lib/newsletter/doi-constants";

export type DoiNewsletterSignupFormProps = {
  signupSource: BrowserSignupSource;
  /** Optional override for tests. */
  controller?: NewsletterSignupController;
  enabled?: boolean;
};

export default function DoiNewsletterSignupForm({
  signupSource,
  controller: controllerProp,
  enabled,
}: DoiNewsletterSignupFormProps) {
  const [controller] = useState(
    () =>
      controllerProp ??
      createNewsletterSignupController({ signupSource, enabled }),
  );
  const [snap, setSnap] = useState(() => controller.getSnapshot());

  useEffect(() => controller.subscribe(() => setSnap(controller.getSnapshot())), [
    controller,
  ]);

  const disabled =
    snap.inFlight ||
    snap.state === "submitting" ||
    snap.state === "accepted" ||
    snap.state === "unavailable";

  const showForm = snap.state !== "accepted" && snap.state !== "unavailable";

  return (
    <div className="doi-signup" data-testid="doi-newsletter-signup">
      {snap.statusMessage ? (
        <p
          className="doi-signup__status"
          role="status"
          data-testid="doi-signup-status"
        >
          {snap.statusMessage}
        </p>
      ) : null}

      {showForm ? (
        <form
          className="doi-signup__form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void controller.submit();
          }}
        >
          <div className="doi-signup__field">
            <label htmlFor="doi-email">{NEWSLETTER_COPY.emailLabel}</label>
            <input
              id="doi-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              disabled={disabled}
              value={snap.values.email}
              onChange={(event) =>
                controller.setValues({ email: event.target.value })
              }
            />
          </div>

          {/* Honeypot: visually hidden; must stay empty. */}
          <div className="doi-signup__hp" aria-hidden="true">
            <label htmlFor="doi-website">Website</label>
            <input
              id="doi-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={snap.values.website}
              onChange={(event) =>
                controller.setValues({ website: event.target.value })
              }
            />
          </div>

          <div className="doi-signup__check">
            <input
              id="doi-consent"
              name="consentAccepted"
              type="checkbox"
              disabled={disabled}
              checked={snap.values.consentAccepted}
              onChange={(event) =>
                controller.setValues({
                  consentAccepted: event.target.checked,
                })
              }
            />
            <label htmlFor="doi-consent">{NEWSLETTER_COPY.consentLabel}</label>
          </div>

          <div className="doi-signup__check">
            <input
              id="doi-age"
              name="ageConfirmed"
              type="checkbox"
              disabled={disabled}
              checked={snap.values.ageConfirmed}
              onChange={(event) =>
                controller.setValues({ ageConfirmed: event.target.checked })
              }
            />
            <label htmlFor="doi-age">{NEWSLETTER_COPY.ageLabel}</label>
          </div>

          {snap.fieldError ? (
            <p
              className="doi-signup__error"
              role="alert"
              data-testid="doi-signup-field-error"
            >
              {snap.fieldError}
            </p>
          ) : null}

          <button type="submit" disabled={disabled}>
            {snap.inFlight
              ? NEWSLETTER_COPY.submittingLabel
              : NEWSLETTER_COPY.submitLabel}
          </button>
        </form>
      ) : null}
    </div>
  );
}
