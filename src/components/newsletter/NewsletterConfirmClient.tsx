'use client'

/**
 * COPY + HARDEN from rewards-maxxing-frontend NewsletterConfirmClient.tsx
 * Hardening: frozen statuses (ready_to_confirm, not valid); token hygiene;
 * no doi-constants; no legacy subscribe fallback.
 *
 * Token is read from the query string on mount, kept in memory, then stripped
 * with history.replaceState (not Next router.replace, which can remount and
 * drop the token). Never log the raw token. Never consume on GET.
 */

import React, { useEffect, useRef, useState } from 'react'

import {
  consumeConfirmToken,
  NEWSLETTER_CONFIRM_PATH,
  validateConfirmToken,
  type ConfirmClientDeps,
} from '../../lib/newsletter/confirm-client'
import { NEWSLETTER_CONFIRM_COPY } from '../../lib/newsletter/newsletter-confirm-copy'
import type {
  ConfirmConsumeBrowserStatus,
  ConfirmValidateBrowserStatus,
} from '../../lib/newsletter/newsletter-public-contract'

export type ConfirmPhase =
  | 'loading'
  | 'ready_to_confirm'
  | 'submitting'
  | ConfirmConsumeBrowserStatus
  | Extract<
      ConfirmValidateBrowserStatus,
      'already_complete' | 'invalid_or_unusable' | 'unable_to_confirm'
    >

export type NewsletterConfirmClientProps = {
  /** Optional injected fetch for local/S4-G tests. */
  fetchImpl?: ConfirmClientDeps['fetchImpl']
}

function copyForFinalPhase(phase: ConfirmPhase): string {
  if (phase === 'success') return NEWSLETTER_CONFIRM_COPY.success
  if (phase === 'already_complete') return NEWSLETTER_CONFIRM_COPY.alreadyComplete
  if (phase === 'invalid_or_unusable') return NEWSLETTER_CONFIRM_COPY.invalid
  return NEWSLETTER_CONFIRM_COPY.unable
}

export default function NewsletterConfirmClient({
  fetchImpl,
}: NewsletterConfirmClientProps = {}) {
  const tokenRef = useRef('')
  const consumeLock = useRef(false)
  const [phase, setPhase] = useState<ConfirmPhase>('loading')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = (params.get('token') ?? '').trim()
    tokenRef.current = token
    window.history.replaceState(null, '', NEWSLETTER_CONFIRM_PATH)

    if (!token) {
      setPhase('invalid_or_unusable')
      return
    }

    let cancelled = false
    void validateConfirmToken(token, { fetchImpl }).then((status) => {
      if (cancelled) return
      if (status === 'ready_to_confirm') {
        setPhase('ready_to_confirm')
        return
      }
      setPhase(status)
    })

    return () => {
      cancelled = true
    }
  }, [fetchImpl])

  async function handleConfirm() {
    if (consumeLock.current || phase !== 'ready_to_confirm' || !tokenRef.current) {
      return
    }
    consumeLock.current = true
    setPhase('submitting')
    const status = await consumeConfirmToken(tokenRef.current, { fetchImpl })
    setPhase(status)
  }

  if (phase === 'loading') {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-semibold text-slate-900">
          {NEWSLETTER_CONFIRM_COPY.heading}
        </h1>
        <p className="text-slate-600" role="status" aria-live="polite">
          {NEWSLETTER_CONFIRM_COPY.loading}
        </p>
      </div>
    )
  }

  if (phase === 'submitting') {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-semibold text-slate-900">
          {NEWSLETTER_CONFIRM_COPY.heading}
        </h1>
        <p className="text-slate-600" role="status" aria-live="polite">
          {NEWSLETTER_CONFIRM_COPY.confirming}
        </p>
      </div>
    )
  }

  if (phase === 'ready_to_confirm') {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-semibold text-slate-900">
          {NEWSLETTER_CONFIRM_COPY.heading}
        </h1>
        <p className="mb-4 text-slate-600">{NEWSLETTER_CONFIRM_COPY.prompt}</p>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {NEWSLETTER_CONFIRM_COPY.button}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold text-slate-900">
        {NEWSLETTER_CONFIRM_COPY.heading}
      </h1>
      <p className="text-slate-700" role="status" aria-live="polite">
        {copyForFinalPhase(phase)}
      </p>
    </div>
  )
}
