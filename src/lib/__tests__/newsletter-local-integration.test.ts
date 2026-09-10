/**
 * S4-G local integration acceptance — assembled DOI + confirmation path
 * against a controlled canonical newsletter-service fixture (no real network).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import React from 'react'
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  createCanonicalNewsletterFixtureFetch,
  createCanonicalNewsletterFixtureState,
  EXPECTED_CONFIRM_PATH,
  EXPECTED_CONSENT_POLICY_VERSION,
  EXPECTED_SUBSCRIBE_PATH,
  EXPECTED_SUBSCRIBE_SUCCESS_MESSAGE,
  EXPECTED_VALIDATE_PATH,
  FIXTURE_NEWSLETTER_SERVICE_ORIGIN,
  type FixtureConsumeMode,
  type FixtureSubscribeMode,
} from '../newsletter/__fixtures__/canonical-newsletter-service'
import {
  handleConfirmConsumePost,
  handleConfirmValidatePost,
  handleSubscribePost,
} from '../newsletter/newsletter-bff'
import { NEWSLETTER_DOI_COPY } from '../newsletter/doi-copy'
import { NEWSLETTER_CONFIRM_COPY } from '../newsletter/newsletter-confirm-copy'
import {
  createDeferredWorkloadIdentityAuth,
  createFakeWorkloadIdentityAuth,
  isFakeWorkloadIdentityAllowed,
} from '../newsletter/newsletter-service-auth'
import { createHttpNewsletterServiceTransport } from '../newsletter/newsletter-service-client'
import { createNewsletterConfirmController } from '../newsletter/newsletter-confirm-controller'
import { createNewsletterSubscribeController } from '../newsletter/newsletter-subscribe-controller'
import {
  NEWSLETTER_CONFIRM_CONSUME_BFF_PATH,
  NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH,
} from '../newsletter/confirm-client'
import { NEWSLETTER_SUBSCRIBE_BFF_PATH } from '../newsletter/subscribe-client'
import DoiNewsletterSignupForm from '../../components/newsletter/DoiNewsletterSignupForm'
import NewsletterConfirmClient from '../../components/newsletter/NewsletterConfirmClient'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const srcRoot = join(rootDir, 'src')
const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'
const FAKE_ASSERTION = 's4g-local-fixture-assertion'

/** Literal browser BFF paths — drift-detect against client modules separately if needed. */
const EXPECTED_BROWSER_SUBSCRIBE_PATH = '/api/newsletter/subscribe'
const EXPECTED_BROWSER_VALIDATE_PATH = '/api/newsletter/confirm/validate'
const EXPECTED_BROWSER_CONFIRM_PATH = '/api/newsletter/confirm'

const EXPECTED_CANONICAL_SUBSCRIBE_DTO = {
  email: 'visitor@example.com',
  consentPolicyVersion: EXPECTED_CONSENT_POLICY_VERSION,
  consentAccepted: true,
  ageConfirmed: true,
  signupSource: 'newsletter_landing',
} as const

function waitForPhase(
  getPhase: () => string,
  subscribe: (listener: () => void) => () => void,
  predicate: () => boolean,
  label: string,
): Promise<void> {
  if (predicate()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe()
      reject(new Error(`Timed out waiting for ${label} (phase=${getPhase()})`))
    }, 2000)
    const unsubscribe = subscribe(() => {
      if (predicate()) {
        clearTimeout(timeout)
        unsubscribe()
        resolve()
      }
    })
  })
}

function createAssembledStack(options: {
  fixture?: ReturnType<typeof createCanonicalNewsletterFixtureState>
  identity?: 'fake' | 'missing'
  acquisitionEnabled?: boolean
}) {
  const fixture =
    options.fixture ?? createCanonicalNewsletterFixtureState()
  const auth =
    options.identity === 'missing'
      ? createDeferredWorkloadIdentityAuth()
      : createFakeWorkloadIdentityAuth(FAKE_ASSERTION)

  const transport = createHttpNewsletterServiceTransport({
    auth,
    env: {
      NEWSLETTER_SERVICE_BASE_URL: FIXTURE_NEWSLETTER_SERVICE_ORIGIN,
      NODE_ENV: 'test',
    },
    fetchImpl: createCanonicalNewsletterFixtureFetch(fixture),
  })

  const acquisitionEnabled = options.acquisitionEnabled ?? true
  const logs: string[] = []

  const bffDeps = {
    transport,
    isAcquisitionEnabled: () => acquisitionEnabled,
    log: { error: (message: string) => logs.push(message) },
  }

  const browserFetch: typeof fetch = async (input, init) => {
    const path = String(input)
    const request = new Request(`http://localhost${path}`, {
      method: init?.method ?? 'POST',
      headers: init?.headers,
      body: init?.body,
    })
    if (path === NEWSLETTER_SUBSCRIBE_BFF_PATH) {
      assert.equal(path, EXPECTED_BROWSER_SUBSCRIBE_PATH)
      return handleSubscribePost(request, bffDeps)
    }
    if (path === NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH) {
      assert.equal(path, EXPECTED_BROWSER_VALIDATE_PATH)
      return handleConfirmValidatePost(request, bffDeps)
    }
    if (path === NEWSLETTER_CONFIRM_CONSUME_BFF_PATH) {
      assert.equal(path, EXPECTED_BROWSER_CONFIRM_PATH)
      return handleConfirmConsumePost(request, bffDeps)
    }
    throw new Error(`unexpected browser fetch path: ${path}`)
  }

  return { fixture, transport, browserFetch, logs, bffDeps }
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue
      walkFiles(full, out)
      continue
    }
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) out.push(full)
  }
  return out
}

type DomHarness = {
  cleanup: () => void
}

function installDom(): DomHarness {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/newsletter/confirm',
    pretendToBeVisual: true,
  })
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Node: globalThis.Node,
    navigator: globalThis.navigator,
    IS_REACT_ACT_ENVIRONMENT: (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT,
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: dom.window,
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: dom.window.document,
  })
  Object.defineProperty(globalThis, 'HTMLElement', {
    configurable: true,
    value: dom.window.HTMLElement,
  })
  Object.defineProperty(globalThis, 'Node', {
    configurable: true,
    value: dom.window.Node,
  })
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: dom.window.navigator,
  })
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true
  // React's legacy input polyfill probes attachEvent; JSDOM lacks IE shims.
  const elementProto = dom.window.HTMLElement.prototype as HTMLElement & {
    attachEvent?: (...args: unknown[]) => void
    detachEvent?: (...args: unknown[]) => void
  }
  if (typeof elementProto.attachEvent !== 'function') {
    elementProto.attachEvent = () => {}
  }
  if (typeof elementProto.detachEvent !== 'function') {
    elementProto.detachEvent = () => {}
  }

  return {
    cleanup() {
      cleanup()
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previous.window,
      })
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: previous.document,
      })
      Object.defineProperty(globalThis, 'HTMLElement', {
        configurable: true,
        value: previous.HTMLElement,
      })
      Object.defineProperty(globalThis, 'Node', {
        configurable: true,
        value: previous.Node,
      })
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: previous.navigator,
      })
      ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
        previous.IS_REACT_ACT_ENVIRONMENT
      dom.window.close()
    },
  }
}

let activeDom: DomHarness | null = null
afterEach(() => {
  if (activeDom) {
    activeDom.cleanup()
    activeDom = null
  }
})

describe('S4-G subscribe happy path (assembled)', () => {
  it('DOI controller → same-origin BFF → fake identity → fixture service → accepted', async () => {
    const { fixture, browserFetch } = createAssembledStack({
      fixture: createCanonicalNewsletterFixtureState({ subscribeMode: 'success_new' }),
    })

    const controller = createNewsletterSubscribeController({
      fetchImpl: browserFetch,
      isAcquisitionEnabled: () => true,
      signupSource: 'newsletter_landing',
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    await controller.submit()
    await waitForPhase(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'accepted',
      'accepted',
    )

    assert.equal(NEWSLETTER_DOI_COPY.accepted, EXPECTED_SUBSCRIBE_SUCCESS_MESSAGE)
    assert.equal(fixture.requests.length, 1)
    assert.equal(fixture.requests[0].path, EXPECTED_SUBSCRIBE_PATH)
    assert.equal(
      fixture.requests[0].authorization,
      `Bearer ${FAKE_ASSERTION}`,
    )
    assert.deepEqual(fixture.requests[0].body, EXPECTED_CANONICAL_SUBSCRIBE_DTO)
    assert.equal(
      JSON.stringify(fixture.requests[0].body).includes('website'),
      false,
    )
  })
})

describe('S4-G DOI React component integration', () => {
  it('form enter email → consent → 21+ → submit → accepted copy rendered', async () => {
    const { fixture, browserFetch } = createAssembledStack({
      fixture: createCanonicalNewsletterFixtureState({ subscribeMode: 'success_new' }),
    })
    activeDom = installDom()
    const user = userEvent.setup({ document: globalThis.document })

    const view = render(
      React.createElement(DoiNewsletterSignupForm, {
        fetchImpl: browserFetch,
        acquisitionEnabled: true,
        signupSource: 'newsletter_landing',
      }),
    )

    const emailInput = view.getByLabelText(NEWSLETTER_DOI_COPY.emailLabel)
    await user.type(emailInput, 'visitor@example.com')
    await user.click(view.getByLabelText(NEWSLETTER_DOI_COPY.consentLabel))
    await user.click(view.getByLabelText(NEWSLETTER_DOI_COPY.ageLabel))
    await user.click(view.getByRole('button', { name: NEWSLETTER_DOI_COPY.submit }))

    await waitFor(() => {
      assert.match(
        view.container.textContent ?? '',
        new RegExp(EXPECTED_SUBSCRIBE_SUCCESS_MESSAGE),
      )
    })

    assert.equal(fixture.requests.length, 1)
    assert.equal(fixture.requests[0].path, EXPECTED_SUBSCRIBE_PATH)
    assert.deepEqual(fixture.requests[0].body, EXPECTED_CANONICAL_SUBSCRIBE_DTO)
    assert.doesNotMatch(view.container.innerHTML, /jackpot-api-newsletter/)
  })
})

describe('S4-G subscribe non-enumeration variants', () => {
  it('maps distinct fixture internal outcomes to the same browser accepted state', async () => {
    const modes: FixtureSubscribeMode[] = [
      'success_new',
      'success_pending',
      'success_known_suppressed',
    ]
    for (const mode of modes) {
      const { fixture, browserFetch } = createAssembledStack({
        fixture: createCanonicalNewsletterFixtureState({ subscribeMode: mode }),
      })
      const controller = createNewsletterSubscribeController({
        fetchImpl: browserFetch,
        isAcquisitionEnabled: () => true,
      })
      controller.setEmail('visitor@example.com')
      controller.setConsentAccepted(true)
      controller.setAgeConfirmed(true)
      await controller.submit()
      assert.equal(controller.getPhase(), 'accepted')
      assert.equal(fixture.requests.length, 1)
      assert.equal(fixture.requests[0].path, EXPECTED_SUBSCRIBE_PATH)
      assert.doesNotMatch(controller.getPhase(), /new|pending|suppressed/)
    }
  })
})

describe('S4-G subscribe failure variants', () => {
  it('rejects invalid email / missing consent / missing age before upstream', async () => {
    const { fixture, browserFetch } = createAssembledStack({})
    const controller = createNewsletterSubscribeController({
      fetchImpl: browserFetch,
      isAcquisitionEnabled: () => true,
    })
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_email')
    controller.setEmail('bad')
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_email')
    controller.setEmail('ok@example.com')
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_consent')
    controller.setConsentAccepted(true)
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_age')
    assert.equal(fixture.requests.length, 0)
  })

  it('maps timeout, network, unauthorized, rate_limited, malformed, unknown, 5xx, kill switch', async () => {
    const cases: Array<{
      mode?: FixtureSubscribeMode
      acquisitionEnabled?: boolean
      expected: string
      upstreamCalls: number
    }> = [
      { mode: 'timeout', expected: 'unavailable', upstreamCalls: 1 },
      { mode: 'network', expected: 'unavailable', upstreamCalls: 1 },
      { mode: 'unauthorized', expected: 'unavailable', upstreamCalls: 1 },
      { mode: 'forbidden', expected: 'unavailable', upstreamCalls: 1 },
      { mode: 'rate_limited', expected: 'rate_limited', upstreamCalls: 1 },
      { mode: 'malformed_json', expected: 'unavailable', upstreamCalls: 1 },
      { mode: 'unknown_success_status', expected: 'unavailable', upstreamCalls: 1 },
      { mode: 'server_error', expected: 'unavailable', upstreamCalls: 1 },
      {
        mode: 'success_new',
        acquisitionEnabled: false,
        expected: 'unavailable',
        upstreamCalls: 0,
      },
    ]

    for (const item of cases) {
      const { fixture, browserFetch } = createAssembledStack({
        fixture: createCanonicalNewsletterFixtureState({
          subscribeMode: item.mode ?? 'success_new',
        }),
        acquisitionEnabled: item.acquisitionEnabled ?? true,
      })
      const controller = createNewsletterSubscribeController({
        fetchImpl: browserFetch,
        isAcquisitionEnabled: () => item.acquisitionEnabled ?? true,
      })
      controller.setEmail('visitor@example.com')
      controller.setConsentAccepted(true)
      controller.setAgeConfirmed(true)
      await controller.submit()
      assert.equal(
        controller.getPhase(),
        item.expected,
        `mode=${item.mode} acquisition=${item.acquisitionEnabled}`,
      )
      assert.equal(fixture.requests.length, item.upstreamCalls)
      if (item.upstreamCalls > 0) {
        assert.equal(fixture.requests[0].path, EXPECTED_SUBSCRIBE_PATH)
      }
    }
  })
})

describe('S4-G confirmation flow (assembled)', () => {
  it('validate ready → confirm success with same-origin paths and token hygiene', async () => {
    const { fixture, browserFetch, logs } = createAssembledStack({
      fixture: createCanonicalNewsletterFixtureState({
        validateMode: 'ready_to_confirm',
        consumeMode: 'success',
      }),
    })

    const controller = createNewsletterConfirmController({
      fetchImpl: browserFetch,
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
    })

    await controller.start()
    await waitForPhase(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'ready_to_confirm',
      'ready',
    )
    await controller.confirm()
    await waitForPhase(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'success',
      'success',
    )

    assert.equal(fixture.requests.length, 2)
    assert.equal(fixture.requests[0].path, EXPECTED_VALIDATE_PATH)
    assert.equal(fixture.requests[1].path, EXPECTED_CONFIRM_PATH)
    assert.equal(controller.hasToken(), false)
    assert.equal(NEWSLETTER_CONFIRM_COPY.success.includes(TOKEN), false)
    for (const line of logs) {
      assert.doesNotMatch(line, new RegExp(TOKEN))
    }
  })

  it('maps already_complete / invalid / unknown validate fail-closed', async () => {
    const validateCases = [
      { mode: 'already_complete' as const, phase: 'already_complete' },
      { mode: 'invalid_or_unusable' as const, phase: 'invalid_or_unusable' },
      { mode: 'unknown_status' as const, phase: 'unable_to_confirm' },
      { mode: 'malformed' as const, phase: 'unable_to_confirm' },
    ]
    for (const item of validateCases) {
      const { browserFetch, fixture } = createAssembledStack({
        fixture: createCanonicalNewsletterFixtureState({
          validateMode: item.mode,
        }),
      })
      const controller = createNewsletterConfirmController({
        fetchImpl: browserFetch,
        getSearch: () => `?token=${TOKEN}`,
        replaceUrl: () => {},
      })
      await controller.start()
      await waitForPhase(
        () => controller.getPhase(),
        (l) => controller.subscribe(l),
        () => controller.getPhase() === item.phase,
        item.phase,
      )
      assert.equal(fixture.requests[0]?.path, EXPECTED_VALIDATE_PATH)
    }
  })

  it('maps consume invalid / unknown / malformed / 401 / 5xx / network to bounded states', async () => {
    const cases: Array<{ mode: FixtureConsumeMode; phase: string }> = [
      { mode: 'invalid_or_unusable', phase: 'invalid_or_unusable' },
      { mode: 'unknown_status', phase: 'unable_to_confirm' },
      { mode: 'malformed', phase: 'unable_to_confirm' },
      { mode: 'unauthorized', phase: 'unable_to_confirm' },
      { mode: 'server_error', phase: 'unable_to_confirm' },
      { mode: 'network', phase: 'unable_to_confirm' },
    ]

    for (const item of cases) {
      const { fixture, browserFetch } = createAssembledStack({
        fixture: createCanonicalNewsletterFixtureState({
          validateMode: 'ready_to_confirm',
          consumeMode: item.mode,
        }),
      })
      const controller = createNewsletterConfirmController({
        fetchImpl: browserFetch,
        getSearch: () => `?token=${TOKEN}`,
        replaceUrl: () => {},
      })
      await controller.start()
      await waitForPhase(
        () => controller.getPhase(),
        (l) => controller.subscribe(l),
        () => controller.getPhase() === 'ready_to_confirm',
        'ready',
      )
      await controller.confirm()
      await waitForPhase(
        () => controller.getPhase(),
        (l) => controller.subscribe(l),
        () => controller.getPhase() === item.phase,
        `consume:${item.mode}`,
      )
      assert.equal(fixture.requests.length, 2)
      assert.equal(fixture.requests[0].path, EXPECTED_VALIDATE_PATH)
      assert.equal(fixture.requests[1].path, EXPECTED_CONFIRM_PATH)
    }
  })
})

describe('S4-G confirmation React component integration', () => {
  it('token bootstrap → validate → Confirm visible → click → success rendered', async () => {
    const replaced: string[] = []
    const { fixture, browserFetch } = createAssembledStack({
      fixture: createCanonicalNewsletterFixtureState({
        validateMode: 'ready_to_confirm',
        consumeMode: 'success',
      }),
    })
    activeDom = installDom()

    const view = render(
      React.createElement(NewsletterConfirmClient, {
        fetchImpl: browserFetch,
        getSearch: () => `?token=${TOKEN}`,
        replaceUrl: (path) => {
          replaced.push(path)
        },
      }),
    )

    const confirmButton = await view.findByRole('button', {
      name: NEWSLETTER_CONFIRM_COPY.button,
    })
    assert.doesNotMatch(view.container.innerHTML, new RegExp(TOKEN))

    fireEvent.click(confirmButton)

    await waitFor(() => {
      assert.match(
        view.container.textContent ?? '',
        new RegExp(NEWSLETTER_CONFIRM_COPY.success),
      )
    })

    assert.equal(fixture.requests.length, 2)
    assert.equal(fixture.requests[0].path, EXPECTED_VALIDATE_PATH)
    assert.equal(fixture.requests[1].path, EXPECTED_CONFIRM_PATH)
    assert.deepEqual(replaced, ['/newsletter/confirm'])
    assert.doesNotMatch(view.container.innerHTML, new RegExp(TOKEN))
  })
})

describe('S4-G workload identity failure', () => {
  it('missing identity prevents protected downstream mutation and returns sanitized failure', async () => {
    const { fixture, browserFetch } = createAssembledStack({
      identity: 'missing',
    })
    const subscribe = createNewsletterSubscribeController({
      fetchImpl: browserFetch,
      isAcquisitionEnabled: () => true,
    })
    subscribe.setEmail('visitor@example.com')
    subscribe.setConsentAccepted(true)
    subscribe.setAgeConfirmed(true)
    await subscribe.submit()
    assert.equal(subscribe.getPhase(), 'unavailable')
    assert.equal(fixture.requests.length, 0)

    const confirm = createNewsletterConfirmController({
      fetchImpl: browserFetch,
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
    })
    await confirm.start()
    await waitForPhase(
      () => confirm.getPhase(),
      (l) => confirm.subscribe(l),
      () => confirm.getPhase() === 'unable_to_confirm',
      'unable',
    )
    assert.equal(fixture.requests.length, 0)
  })

  it('fake identity remains forbidden in production mode', () => {
    assert.equal(
      isFakeWorkloadIdentityAllowed({
        NODE_ENV: 'production',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
      }),
      false,
    )
  })
})

describe('S4-G repository guardrails', () => {
  it('keeps legacy writers, SendGrid, service hostname, and secrets out of active runtime', () => {
    const patterns = [
      '/api/subscribe',
      'email_signups',
      'SUPABASE_SERVICE_ROLE_KEY',
      'getSupabaseAdminClient',
      'reward_access_token',
      'access_token',
      'subscriber_email_hash',
      'NEXT_PUBLIC_NEWSLETTER',
      '@sendgrid',
      'sendgrid',
      'SendGrid',
    ] as const

    const hits: Record<string, string[]> = Object.fromEntries(
      patterns.map((p) => [p, [] as string[]]),
    )

    for (const file of walkFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8')
      const rel = relative(srcRoot, file).replace(/\\/g, '/')
      if (rel.includes('__tests__/') || rel.includes('__fixtures__/')) continue
      for (const pattern of patterns) {
        if (source.includes(pattern)) hits[pattern].push(rel)
      }
    }

    for (const pattern of patterns) {
      assert.deepEqual(hits[pattern], [], `${pattern}: ${hits[pattern].join(', ')}`)
    }
  })

  it('browser DOI/confirm modules do not import server identity/transport', () => {
    const clientFiles = [
      'components/InlineNewsletterHero.tsx',
      'components/newsletter/DoiNewsletterSignupForm.tsx',
      'components/newsletter/NewsletterConfirmClient.tsx',
      'lib/newsletter/subscribe-client.ts',
      'lib/newsletter/confirm-client.ts',
      'lib/newsletter/newsletter-subscribe-controller.ts',
      'lib/newsletter/newsletter-confirm-controller.ts',
      'app/page.tsx',
      'app/newsletter/confirm/page.tsx',
    ]
    const forbidden = [
      'newsletter-service-auth',
      'newsletter-service-client',
      'newsletter-service-env',
      'newsletter-bff',
      'newsletter-acquisition-gate',
      'server-only',
      'jackpot-api-newsletter',
      '/api/public/newsletter',
    ]
    for (const relativePath of clientFiles) {
      const source = readFileSync(join(srcRoot, relativePath), 'utf8')
      for (const token of forbidden) {
        assert.equal(
          source.includes(token),
          false,
          `${relativePath} must not contain ${token}`,
        )
      }
    }
  })

  it('production canonical contract still matches frozen fixture path literals', () => {
    const source = readFileSync(
      join(srcRoot, 'lib/newsletter/newsletter-canonical-contract.ts'),
      'utf8',
    )
    assert.match(source, new RegExp(`'${EXPECTED_SUBSCRIBE_PATH}'`))
    assert.match(source, new RegExp(`'${EXPECTED_VALIDATE_PATH}'`))
    assert.match(source, new RegExp(`'${EXPECTED_CONFIRM_PATH}'`))
  })
})
