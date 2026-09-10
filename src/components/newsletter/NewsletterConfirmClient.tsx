'use client'

/**
 * COPY + HARDEN from rewards-maxxing-frontend NewsletterConfirmClient.tsx
 * Hardening: frozen statuses (ready_to_confirm, not valid); token hygiene;
 * manual unable_to_confirm retry via re-validate; accessible focus on transitions.
 *
 * Token is read from the query string on mount, kept in memory only while needed,
 * then stripped with history.replaceState. Never log the raw token. Never consume on GET.
 */

import React, { useEffect, useRef, useState } from 'react'

import type { ConfirmClientDeps } from '../../lib/newsletter/confirm-client'
import { NEWSLETTER_CONFIRM_COPY } from '../../lib/newsletter/newsletter-confirm-copy'
import {
  createNewsletterConfirmController,
  type ConfirmPhase,
  type NewsletterConfirmController,
} from '../../lib/newsletter/newsletter-confirm-controller'

export type { ConfirmPhase }

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

function focusTargetForPhase(phase: ConfirmPhase): 'status' | 'confirm' | 'retry' | null {
  if (phase === 'loading' || phase === 'submitting') return 'status'
  if (phase === 'ready_to_confirm') return 'confirm'
  if (phase === 'unable_to_confirm') return 'retry'
  if (
    phase === 'success' ||
    phase === 'already_complete' ||
    phase === 'invalid_or_unusable'
  ) {
    return 'status'
  }
  return null
}

export default function NewsletterConfirmClient({
  fetchImpl,
}: NewsletterConfirmClientProps = {}) {
  const controllerRef = useRef<NewsletterConfirmController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = createNewsletterConfirmController({
      fetchImpl,
      getSearch: () => window.location.search,
      replaceUrl: (path) => {
        window.history.replaceState(null, '', path)
      },
    })
  }
  const controller = controllerRef.current
  const [phase, setPhase] = useState<ConfirmPhase>(() => controller.getPhase())
  const statusRef = useRef<HTMLParagraphElement | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)
  const retryButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      setPhase(controller.getPhase())
    })
    void controller.start()
    return () => {
      unsubscribe()
      controller.dispose()
      controllerRef.current = null
    }
  }, [controller])

  useEffect(() => {
    const target = focusTargetForPhase(phase)
    if (target === 'confirm') {
      confirmButtonRef.current?.focus()
      return
    }
    if (target === 'retry') {
      retryButtonRef.current?.focus()
      return
    }
    if (target === 'status') {
      statusRef.current?.focus()
    }
  }, [phase])

  if (phase === 'loading') {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-semibold text-slate-900">
          {NEWSLETTER_CONFIRM_COPY.heading}
        </h1>
        <p
          ref={statusRef}
          tabIndex={-1}
          className="text-slate-600 outline-none"
          role="status"
          aria-live="polite"
        >
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
        <p
          ref={statusRef}
          tabIndex={-1}
          className="text-slate-600 outline-none"
          role="status"
          aria-live="polite"
        >
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
          ref={confirmButtonRef}
          type="button"
          onClick={() => void controller.confirm()}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {NEWSLETTER_CONFIRM_COPY.button}
        </button>
      </div>
    )
  }

  if (phase === 'unable_to_confirm') {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-semibold text-slate-900">
          {NEWSLETTER_CONFIRM_COPY.heading}
        </h1>
        <p
          ref={statusRef}
          tabIndex={-1}
          className="mb-4 text-slate-700 outline-none"
          role="status"
          aria-live="polite"
        >
          {NEWSLETTER_CONFIRM_COPY.unable}
        </p>
        <button
          ref={retryButtonRef}
          type="button"
          onClick={() => void controller.retry()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          {NEWSLETTER_CONFIRM_COPY.retryButton}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold text-slate-900">
        {NEWSLETTER_CONFIRM_COPY.heading}
      </h1>
      <p
        ref={statusRef}
        tabIndex={-1}
        className="text-slate-700 outline-none"
        role="status"
        aria-live="polite"
      >
        {copyForFinalPhase(phase)}
      </p>
    </div>
  )
}
