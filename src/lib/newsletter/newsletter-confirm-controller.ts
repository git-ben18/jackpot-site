/**
 * Testable confirmation state machine for S4-E.
 * Keeps token hygiene and retry rules outside React rendering.
 */
import {
  consumeConfirmToken,
  NEWSLETTER_CONFIRM_PATH,
  validateConfirmToken,
  type ConfirmClientDeps,
} from './confirm-client'
import type {
  ConfirmConsumeBrowserStatus,
  ConfirmValidateBrowserStatus,
} from './newsletter-public-contract'
import {
  emitApprovedEventFailSoft,
  getDefaultFirstReleaseTelemetry,
  type FirstReleaseTelemetryEmitter,
} from '../telemetry/first-release-telemetry-emitter'
import { shouldEmitNewsletterSubscriptionConfirmed } from '../telemetry/first-release-telemetry-contract'
import { newsletterConfirmedOnceKey } from '../telemetry/first-release-telemetry-triggers'

export type ConfirmPhase =
  | 'loading'
  | 'ready_to_confirm'
  | 'submitting'
  | ConfirmConsumeBrowserStatus
  | Extract<
      ConfirmValidateBrowserStatus,
      'already_complete' | 'invalid_or_unusable' | 'unable_to_confirm'
    >

export type NewsletterConfirmControllerDeps = ConfirmClientDeps & {
  getSearch?: () => string
  replaceUrl?: (path: string) => void
  /** Optional S5-F seam; production defaults to the disabled sink. */
  telemetry?: FirstReleaseTelemetryEmitter
}

const TERMINAL_CLEAR_TOKEN_PHASES = new Set<ConfirmPhase>([
  'success',
  'already_complete',
  'invalid_or_unusable',
])

function shouldClearToken(phase: ConfirmPhase): boolean {
  return TERMINAL_CLEAR_TOKEN_PHASES.has(phase)
}

export type NewsletterConfirmController = {
  getPhase: () => ConfirmPhase
  /** Opaque presence check — never returns the raw token. */
  hasToken: () => boolean
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  confirm: () => Promise<void>
  /** Manual retry: re-validate only (never auto-retry; never consume first). */
  retry: () => Promise<void>
  dispose: () => void
}

export function createNewsletterConfirmController(
  deps: NewsletterConfirmControllerDeps = {},
): NewsletterConfirmController {
  let phase: ConfirmPhase = 'loading'
  let token = ''
  let consumeLocked = false
  let disposed = false
  let generation = 0
  const listeners = new Set<() => void>()

  const getSearch = deps.getSearch ?? (() => '')
  const telemetry = deps.telemetry ?? getDefaultFirstReleaseTelemetry()
  const replaceUrl =
    deps.replaceUrl ??
    ((path: string) => {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', path)
      }
    })

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function setPhase(next: ConfirmPhase): void {
    phase = next
    if (shouldClearToken(next)) {
      token = ''
    }
    if (next === 'unable_to_confirm' || next === 'ready_to_confirm') {
      consumeLocked = false
    }
    notify()
  }

  async function runValidate(currentGeneration: number): Promise<void> {
    if (!token) {
      setPhase('invalid_or_unusable')
      return
    }

    setPhase('loading')
    const status = await validateConfirmToken(token, deps)
    if (disposed || currentGeneration !== generation) return

    if (status === 'ready_to_confirm') {
      setPhase('ready_to_confirm')
      return
    }
    setPhase(status)
  }

  return {
    getPhase: () => phase,
    hasToken: () => token.length > 0,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    async start() {
      const params = new URLSearchParams(getSearch())
      token = (params.get('token') ?? '').trim()
      replaceUrl(NEWSLETTER_CONFIRM_PATH)

      if (!token) {
        setPhase('invalid_or_unusable')
        return
      }

      const currentGeneration = ++generation
      await runValidate(currentGeneration)
    },
    async confirm() {
      if (consumeLocked || phase !== 'ready_to_confirm' || !token) return
      consumeLocked = true
      const heldToken = token
      const currentGeneration = ++generation
      setPhase('submitting')
      const status = await consumeConfirmToken(heldToken, deps)
      if (disposed || currentGeneration !== generation) return
      setPhase(status)
      if (shouldEmitNewsletterSubscriptionConfirmed(status)) {
        emitApprovedEventFailSoft(
          telemetry,
          'newsletter_subscription_confirmed',
          {},
          { onceKey: newsletterConfirmedOnceKey() },
        )
      }
    },
    async retry() {
      if (phase !== 'unable_to_confirm' || !token) return
      consumeLocked = false
      const currentGeneration = ++generation
      await runValidate(currentGeneration)
    },
    dispose() {
      disposed = true
      generation += 1
      token = ''
      consumeLocked = false
      listeners.clear()
    },
  }
}
