import React from "react";

import DoiNewsletterSignupForm from "@/components/newsletter/DoiNewsletterSignupForm";
import {
  DEFAULT_HOMEPAGE_SIGNUP_SOURCE,
  NEWSLETTER_COPY,
} from "@/lib/newsletter/doi-constants";

/**
 * Homepage newsletter hero — REIMPLEMENT (DOI-only).
 * Does not restore modal/slide-in/footer legacy fallback writers.
 */
export default function InlineNewsletterHero() {
  return (
    <section
      className="doi-hero"
      aria-labelledby="doi-hero-heading"
      data-testid="inline-newsletter-hero"
    >
      <p className="doi-hero__brand">{NEWSLETTER_COPY.heroBrandEyebrow}</p>
      <h2 id="doi-hero-heading" className="doi-hero__headline">
        {NEWSLETTER_COPY.heroHeadline}
      </h2>
      <p className="doi-hero__support muted">{NEWSLETTER_COPY.heroSupport}</p>
      <DoiNewsletterSignupForm signupSource={DEFAULT_HOMEPAGE_SIGNUP_SOURCE} />
    </section>
  );
}
