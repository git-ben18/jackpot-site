/**
 * REIMPLEMENT of rewards-maxxing-frontend InlineNewsletterHero.tsx
 * DOI-only: mounts DoiNewsletterSignupForm directly. No legacy writer,
 * modal/footer fallback, or soft-gate persistence.
 */

import React from 'react'

import DoiNewsletterSignupForm from './newsletter/DoiNewsletterSignupForm'
import { NEWSLETTER_DOI_COPY } from '../lib/newsletter/doi-copy'

export type InlineNewsletterHeroProps = {
  /** Client kill-switch seam forwarded to the form. */
  acquisitionEnabled?: boolean
}

export default function InlineNewsletterHero({
  acquisitionEnabled = true,
}: InlineNewsletterHeroProps = {}) {
  return (
    <section aria-labelledby="doi-hero-heading" className="mb-10">
      <h2 id="doi-hero-heading" className="mb-2 text-2xl font-semibold text-slate-900">
        {NEWSLETTER_DOI_COPY.heroHeading}
      </h2>
      <p className="mb-5 max-w-2xl text-slate-600">{NEWSLETTER_DOI_COPY.heroSupport}</p>
      <DoiNewsletterSignupForm
        signupSource="newsletter_landing"
        acquisitionEnabled={acquisitionEnabled}
      />
    </section>
  )
}
