/**
 * Testable DOI subscribe state machine for S4-B.
 * Keeps mutation gating and in-flight lock outside React rendering.
 */
import {
  subscribeNewsletter,
  type SubscribeClientDeps,
} from './subscribe-client'
import type { BrowserSignupSource } from './newsletter-public-contract'
import {
  emitApprovedEventFailSoft,
  getDefaultFirstReleaseTelemetry,
  type FirstReleaseTelemetryEmitter,
} from '../telemetry/first-release-telemetry-emitter'
import {
  isTelemetrySignupSourceV1,
  shouldEmitNewsletterSubscribeRequested,
} from '../telemetry/first-release-telemetry-contract'

export type SubscribePhase =
  | 'idle'
  | 'validating'
  | 'submitting'
  | 'accepted'
  | 'invalid'
  | 'rate_limited'
  | 'unavailable'

export type SubscribeFormValues = {
  email: string
  consentAccepted: boolean
  ageConfirmed: boolean
  website: string
}

export type NewsletterSubscribeControllerDeps = SubscribeClientDeps & {
  signupSource?: BrowserSignupSource
  /** Client-side kill-switch seam; false prevents network mutation. */
  isAcquisitionEnabled?: () => boolean
  /** Optional S5-F seam; production defaults to the disabled sink. */
  telemetry?: FirstReleaseTelemetryEmitter
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type NewsletterSubscribeController = {
  getPhase: () => SubscribePhase
  getValues: () => SubscribeFormValues
  getClientError: () => string | null
  subscribe: (listener: () => void) => () => void
  setEmail: (email: string) => void
  setConsentAccepted: (value: boolean) => void
  setAgeConfirmed: (value: boolean) => void
  setWebsite: (value: string) => void
  submit: () => Promise<void>
  resetToIdle: () => void
}

export function createNewsletterSubscribeController(
  deps: NewsletterSubscribeControllerDeps = {},
): NewsletterSubscribeController {
  let phase: SubscribePhase = 'idle'
  let clientError: string | null = null
  let submitLocked = false
  const values: SubscribeFormValues = {
    email: '',
    consentAccepted: false,
    ageConfirmed: false,
    website: '',
  }
  const listeners = new Set<() => void>()
  const signupSource = deps.signupSource ?? 'newsletter_landing'
  const isAcquisitionEnabled = deps.isAcquisitionEnabled ?? (() => true)
  const telemetry = deps.telemetry ?? getDefaultFirstReleaseTelemetry()

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function setPhase(next: SubscribePhase, error: string | null = null): void {
    phase = next
    clientError = error
    if (next !== 'submitting' && next !== 'validating') {
      submitLocked = false
    }
    notify()
  }

  return {
    getPhase: () => phase,
    getValues: () => ({ ...values }),
    getClientError: () => clientError,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setEmail(email) {
      values.email = email
      if (phase === 'invalid' || phase === 'rate_limited' || phase === 'unavailable') {
        setPhase('idle')
      } else {
        notify()
      }
    },
    setConsentAccepted(value) {
      values.consentAccepted = value
      if (phase !== 'idle' && phase !== 'submitting' && phase !== 'accepted') {
        setPhase('idle')
      } else {
        notify()
      }
    },
    setAgeConfirmed(value) {
      values.ageConfirmed = value
      if (phase !== 'idle' && phase !== 'submitting' && phase !== 'accepted') {
        setPhase('idle')
      } else {
        notify()
      }
    },
    setWebsite(value) {
      values.website = value
      notify()
    },
    async submit() {
      if (
        submitLocked ||
        phase === 'submitting' ||
        phase === 'validating' ||
        phase === 'accepted'
      ) {
        return
      }

      submitLocked = true
      setPhase('validating')
      const email = values.email.trim()
      if (email.length < 3 || email.length > 320 || !EMAIL_PATTERN.test(email)) {
        setPhase('invalid', 'missing_email')
        return
      }
      if (!values.consentAccepted) {
        setPhase('invalid', 'missing_consent')
        return
      }
      if (!values.ageConfirmed) {
        setPhase('invalid', 'missing_age')
        return
      }

      if (!isAcquisitionEnabled()) {
        setPhase('unavailable')
        return
      }

      setPhase('submitting')
      const status = await subscribeNewsletter(
        {
          email,
          consentAccepted: true,
          ageConfirmed: true,
          signupSource,
          website: values.website,
        },
        deps,
      )
      setPhase(status)
      if (
        shouldEmitNewsletterSubscribeRequested(status) &&
        isTelemetrySignupSourceV1(signupSource)
      ) {
        emitApprovedEventFailSoft(telemetry, 'newsletter_subscribe_requested', {
          signupSource,
        })
      }
    },
    resetToIdle() {
      submitLocked = false
      setPhase('idle')
    },
  }
}
