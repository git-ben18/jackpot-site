/**
 * S4-G local integration acceptance — assembled DOI + confirmation path
 * against a controlled canonical newsletter-service fixture (no real network).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  createCanonicalNewsletterFixtureFetch,
  createCanonicalNewsletterFixtureState,
  FIXTURE_NEWSLETTER_SERVICE_ORIGIN,
  type FixtureSubscribeMode,
} from '../newsletter/__fixtures__/canonical-newsletter-service'
import {
  CANONICAL_CONFIRM_PATH,
  CANONICAL_CONFIRM_VALIDATE_PATH,
  CANONICAL_SUBSCRIBE_PATH,
  translateBrowserSubscribeToCanonical,
} from '../newsletter/newsletter-canonical-contract'
import {
  handleConfirmConsumePost,
  handleConfirmValidatePost,
  handleSubscribePost,
} from '../newsletter/newsletter-bff'
import { NEWSLETTER_DOI_COPY } from '../newsletter/doi-copy'
import { NEWSLETTER_CONFIRM_COPY } from '../newsletter/newsletter-confirm-copy'
import {
  NEWSLETTER_CHECK_EMAIL_COPY,
  NEWSLETTER_CONSENT_POLICY_VERSION,
} from '../newsletter/newsletter-public-contract'
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

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const srcRoot = join(root, 'src')
const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'
const FAKE_ASSERTION = 's4g-local-fixture-assertion'

function waitFor(
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
    }, 1500)
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
      return handleSubscribePost(request, bffDeps)
    }
    if (path === NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH) {
      return handleConfirmValidatePost(request, bffDeps)
    }
    if (path === NEWSLETTER_CONFIRM_CONSUME_BFF_PATH) {
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
    await waitFor(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'accepted',
      'accepted',
    )

    assert.equal(NEWSLETTER_DOI_COPY.accepted, NEWSLETTER_CHECK_EMAIL_COPY)
    assert.equal(fixture.requests.length, 1)
    assert.equal(fixture.requests[0].path, CANONICAL_SUBSCRIBE_PATH)
    assert.equal(
      fixture.requests[0].authorization,
      `Bearer ${FAKE_ASSERTION}`,
    )
    assert.deepEqual(
      fixture.requests[0].body,
      translateBrowserSubscribeToCanonical({
        email: 'visitor@example.com',
        consentAccepted: true,
        ageConfirmed: true,
        consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
        signupSource: 'newsletter_landing',
      }),
    )
    assert.equal(
      JSON.stringify(fixture.requests[0].body).includes('website'),
      false,
    )
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
      // Browser phase never carries internal fixture labels.
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
    await waitFor(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'ready_to_confirm',
      'ready',
    )
    await controller.confirm()
    await waitFor(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'success',
      'success',
    )

    assert.equal(fixture.requests.length, 2)
    assert.equal(fixture.requests[0].path, CANONICAL_CONFIRM_VALIDATE_PATH)
    assert.equal(fixture.requests[1].path, CANONICAL_CONFIRM_PATH)
    assert.equal(controller.hasToken(), false)
    assert.equal(NEWSLETTER_CONFIRM_COPY.success.includes(TOKEN), false)
    for (const line of logs) {
      assert.doesNotMatch(line, new RegExp(TOKEN))
    }
  })

  it('maps already_complete / invalid / unknown validate and consume fail-closed', async () => {
    const validateCases = [
      { mode: 'already_complete' as const, phase: 'already_complete' },
      { mode: 'invalid_or_unusable' as const, phase: 'invalid_or_unusable' },
      { mode: 'unknown_status' as const, phase: 'unable_to_confirm' },
      { mode: 'malformed' as const, phase: 'unable_to_confirm' },
    ]
    for (const item of validateCases) {
      const { browserFetch } = createAssembledStack({
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
      await waitFor(
        () => controller.getPhase(),
        (l) => controller.subscribe(l),
        () => controller.getPhase() === item.phase,
        item.phase,
      )
    }

    const { browserFetch } = createAssembledStack({
      fixture: createCanonicalNewsletterFixtureState({
        validateMode: 'ready_to_confirm',
        consumeMode: 'already_complete',
      }),
    })
    const controller = createNewsletterConfirmController({
      fetchImpl: browserFetch,
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
    })
    await controller.start()
    await waitFor(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'ready_to_confirm',
      'ready',
    )
    await controller.confirm()
    await waitFor(
      () => controller.getPhase(),
      (l) => controller.subscribe(l),
      () => controller.getPhase() === 'already_complete',
      'already_complete',
    )
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
    await waitFor(
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
})
