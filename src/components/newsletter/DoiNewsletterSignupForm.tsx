'use client'

/**
 * COPY + HARDEN from rewards-maxxing-frontend DoiNewsletterSignupForm.tsx
 * Hardening: EC-05A consent/age copy; frozen browser statuses; same-origin
 * subscribe client only; honeypot retained; no legacy storage/writers;
 * client kill-switch seam + BFF unavailable mapping.
 */

import React, { useEffect, useRef, useState } from 'react'

import { NEWSLETTER_DOI_COPY } from '../../lib/newsletter/doi-copy'
import {
  createNewsletterSubscribeController,
  type NewsletterSubscribeController,
  type SubscribePhase,
} from '../../lib/newsletter/newsletter-subscribe-controller'
import type { SubscribeClientDeps } from '../../lib/newsletter/subscribe-client'
import type { BrowserSignupSource } from '../../lib/newsletter/newsletter-public-contract'

export type DoiNewsletterSignupFormProps = {
  signupSource?: BrowserSignupSource
  /** Optional injected fetch for local/S4-G tests. */
  fetchImpl?: SubscribeClientDeps['fetchImpl']
  /** Client kill-switch seam; false prevents mutation request. */
  acquisitionEnabled?: boolean
}

function statusCopy(phase: SubscribePhase, clientError: string | null): string {
  if (phase === 'accepted') return NEWSLETTER_DOI_COPY.accepted
  if (phase === 'rate_limited') return NEWSLETTER_DOI_COPY.rateLimited
  if (phase === 'unavailable') return NEWSLETTER_DOI_COPY.unavailable
  if (phase === 'invalid') {
    if (clientError === 'missing_email') return NEWSLETTER_DOI_COPY.missingEmail
    if (clientError === 'missing_consent') return NEWSLETTER_DOI_COPY.missingConsent
    if (clientError === 'missing_age') return NEWSLETTER_DOI_COPY.missingAge
    return NEWSLETTER_DOI_COPY.invalid
  }
  if (phase === 'submitting') return NEWSLETTER_DOI_COPY.submitting
  return ''
}

export default function DoiNewsletterSignupForm({
  signupSource = 'newsletter_landing',
  fetchImpl,
  acquisitionEnabled = true,
}: DoiNewsletterSignupFormProps) {
  const controllerRef = useRef<NewsletterSubscribeController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = createNewsletterSubscribeController({
      signupSource,
      fetchImpl,
      isAcquisitionEnabled: () => acquisitionEnabled,
    })
  }
  const controller = controllerRef.current
  const [phase, setPhase] = useState<SubscribePhase>(() => controller.getPhase())
  const [values, setValues] = useState(() => controller.getValues())
  const [clientError, setClientError] = useState<string | null>(() =>
    controller.getClientError(),
  )
  const statusRef = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      setPhase(controller.getPhase())
      setValues(controller.getValues())
      setClientError(controller.getClientError())
    })
    return unsubscribe
  }, [controller])

  useEffect(() => {
    if (
      phase === 'accepted' ||
      phase === 'invalid' ||
      phase === 'rate_limited' ||
      phase === 'unavailable' ||
      phase === 'submitting'
    ) {
      statusRef.current?.focus()
    }
  }, [phase])

  const busy = phase === 'submitting' || phase === 'validating'
  const message = statusCopy(phase, clientError)

  if (phase === 'accepted') {
    return (
      <div>
        <p
          ref={statusRef}
          tabIndex={-1}
          className="text-slate-700 outline-none"
          role="status"
          aria-live="polite"
        >
          {NEWSLETTER_DOI_COPY.accepted}
        </p>
      </div>
    )
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void controller.submit()
      }}
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="doi-email" className="text-sm font-medium text-slate-800">
          {NEWSLETTER_DOI_COPY.emailLabel}
        </label>
        <input
          id="doi-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={busy}
          value={values.email}
          onChange={(event) => controller.setEmail(event.target.value)}
          placeholder={NEWSLETTER_DOI_COPY.emailPlaceholder}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </div>

      {/* Honeypot — visually hidden; leave empty for humans. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="doi-website">Website</label>
        <input
          id="doi-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => controller.setWebsite(event.target.value)}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={values.consentAccepted}
          disabled={busy}
          onChange={(event) => controller.setConsentAccepted(event.target.checked)}
        />
        <span>{NEWSLETTER_DOI_COPY.consentLabel}</span>
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={values.ageConfirmed}
          disabled={busy}
          onChange={(event) => controller.setAgeConfirmed(event.target.checked)}
        />
        <span>{NEWSLETTER_DOI_COPY.ageLabel}</span>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {busy ? NEWSLETTER_DOI_COPY.submitting : NEWSLETTER_DOI_COPY.submit}
      </button>

      {message ? (
        <p
          ref={statusRef}
          tabIndex={-1}
          className="text-sm text-slate-700 outline-none"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  )
}
