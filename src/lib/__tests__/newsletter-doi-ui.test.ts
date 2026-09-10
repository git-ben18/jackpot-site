import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { NEWSLETTER_DOI_COPY } from '../newsletter/doi-copy'
import { createNewsletterSubscribeController } from '../newsletter/newsletter-subscribe-controller'
import {
  NEWSLETTER_SUBSCRIBE_BFF_PATH,
  subscribeNewsletter,
} from '../newsletter/subscribe-client'
import {
  NEWSLETTER_CHECK_EMAIL_COPY,
  NEWSLETTER_CONSENT_POLICY_VERSION,
} from '../newsletter/newsletter-public-contract'
import DoiNewsletterSignupForm from '../../components/newsletter/DoiNewsletterSignupForm'
import InlineNewsletterHero from '../../components/InlineNewsletterHero'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function waitFor(
  controller: ReturnType<typeof createNewsletterSubscribeController>,
  predicate: () => boolean,
  label: string,
): Promise<void> {
  if (predicate()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe()
      reject(new Error(`Timed out waiting for ${label} (phase=${controller.getPhase()})`))
    }, 1000)
    const unsubscribe = controller.subscribe(() => {
      if (predicate()) {
        clearTimeout(timeout)
        unsubscribe()
        resolve()
      }
    })
  })
}

describe('S4-B subscribe-client', () => {
  it('posts only to the same-origin BFF with frozen DTO fields', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const status = await subscribeNewsletter(
      {
        email: ' visitor@example.com ',
        consentAccepted: true,
        ageConfirmed: true,
        signupSource: 'newsletter_landing',
        website: '',
      },
      {
        fetchImpl: async (url, init) => {
          calls.push({ url: String(url), init: init ?? {} })
          return jsonResponse(200, { status: 'accepted' })
        },
      },
    )
    assert.equal(status, 'accepted')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, NEWSLETTER_SUBSCRIBE_BFF_PATH)
    assert.equal(calls[0].init.method, 'POST')
    const body = JSON.parse(String(calls[0].init.body)) as Record<string, unknown>
    assert.deepEqual(body, {
      email: 'visitor@example.com',
      consentAccepted: true,
      ageConfirmed: true,
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      signupSource: 'newsletter_landing',
      website: '',
    })
    assert.equal('consentTextVersion' in body, false)
  })

  it('does not treat arbitrary 2xx as accepted', async () => {
    assert.equal(
      await subscribeNewsletter(
        {
          email: 'visitor@example.com',
          consentAccepted: true,
          ageConfirmed: true,
          signupSource: 'newsletter_landing',
        },
        {
          fetchImpl: async () => jsonResponse(200, { status: 'mystery' }),
        },
      ),
      'unavailable',
    )
    assert.equal(
      await subscribeNewsletter(
        {
          email: 'visitor@example.com',
          consentAccepted: true,
          ageConfirmed: true,
          signupSource: 'newsletter_landing',
        },
        {
          fetchImpl: async () => jsonResponse(202, { status: 'accepted' }),
        },
      ),
      'unavailable',
    )
  })

  it('maps rate_limited / invalid / unavailable and network failure', async () => {
    assert.equal(
      await subscribeNewsletter(
        {
          email: 'visitor@example.com',
          consentAccepted: true,
          ageConfirmed: true,
          signupSource: 'newsletter_landing',
        },
        { fetchImpl: async () => jsonResponse(429, { status: 'rate_limited' }) },
      ),
      'rate_limited',
    )
    assert.equal(
      await subscribeNewsletter(
        {
          email: 'visitor@example.com',
          consentAccepted: true,
          ageConfirmed: true,
          signupSource: 'newsletter_landing',
        },
        { fetchImpl: async () => jsonResponse(400, { status: 'invalid' }) },
      ),
      'invalid',
    )
    assert.equal(
      await subscribeNewsletter(
        {
          email: 'visitor@example.com',
          consentAccepted: true,
          ageConfirmed: true,
          signupSource: 'newsletter_landing',
        },
        {
          fetchImpl: async () => {
            throw new Error('offline')
          },
        },
      ),
      'unavailable',
    )
  })
})

describe('S4-B subscribe controller behavior', () => {
  it('rejects invalid email / missing consent / missing age before network', async () => {
    let fetched = false
    const controller = createNewsletterSubscribeController({
      fetchImpl: async () => {
        fetched = true
        return jsonResponse(200, { status: 'accepted' })
      },
    })

    await controller.submit()
    assert.equal(controller.getPhase(), 'invalid')
    assert.equal(controller.getClientError(), 'missing_email')

    controller.setEmail('not-an-email')
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_email')

    controller.setEmail('visitor@example.com')
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_consent')

    controller.setConsentAccepted(true)
    await controller.submit()
    assert.equal(controller.getClientError(), 'missing_age')
    assert.equal(fetched, false)
  })

  it('valid submit calls BFF once and reaches accepted with non-enumerating copy', async () => {
    let calls = 0
    const controller = createNewsletterSubscribeController({
      fetchImpl: async () => {
        calls += 1
        return jsonResponse(200, { status: 'accepted' })
      },
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    await controller.submit()
    await waitFor(controller, () => controller.getPhase() === 'accepted', 'accepted')
    assert.equal(calls, 1)
    assert.equal(NEWSLETTER_DOI_COPY.accepted, NEWSLETTER_CHECK_EMAIL_COPY)
  })

  it('ignores repeated in-flight submits', async () => {
    let release!: (value: Response) => void
    const gate = new Promise<Response>((resolve) => {
      release = resolve
    })
    let calls = 0
    const controller = createNewsletterSubscribeController({
      fetchImpl: async () => {
        calls += 1
        return gate
      },
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    const first = controller.submit()
    const second = controller.submit()
    await waitFor(controller, () => controller.getPhase() === 'submitting', 'submitting')
    release(jsonResponse(200, { status: 'accepted' }))
    await Promise.all([first, second])
    assert.equal(calls, 1)
    assert.equal(controller.getPhase(), 'accepted')
  })

  it('kill switch prevents mutation and maps to unavailable', async () => {
    let fetched = false
    const controller = createNewsletterSubscribeController({
      isAcquisitionEnabled: () => false,
      fetchImpl: async () => {
        fetched = true
        return jsonResponse(200, { status: 'accepted' })
      },
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    await controller.submit()
    assert.equal(controller.getPhase(), 'unavailable')
    assert.equal(fetched, false)
  })

  it('maps BFF unavailable and rate_limited to bounded phases', async () => {
    const unavailable = createNewsletterSubscribeController({
      fetchImpl: async () => jsonResponse(503, { status: 'unavailable' }),
    })
    unavailable.setEmail('visitor@example.com')
    unavailable.setConsentAccepted(true)
    unavailable.setAgeConfirmed(true)
    await unavailable.submit()
    assert.equal(unavailable.getPhase(), 'unavailable')

    const limited = createNewsletterSubscribeController({
      fetchImpl: async () => jsonResponse(429, { status: 'rate_limited' }),
    })
    limited.setEmail('visitor@example.com')
    limited.setConsentAccepted(true)
    limited.setAgeConfirmed(true)
    await limited.submit()
    assert.equal(limited.getPhase(), 'rate_limited')
  })
})

describe('S4-B DOI presentation guardrails', () => {
  it('renders hero and form with EC-05A consent/age copy and honeypot', () => {
    const html = renderToStaticMarkup(createElement(InlineNewsletterHero))
    assert.match(html, new RegExp(NEWSLETTER_DOI_COPY.heroHeading))
    assert.match(html, /type="email"/)
    assert.match(html, /21 years of age or older/)
    assert.match(html, /Jackpot Homie email newsletter/)
    assert.match(html, /name="website"/)
    assert.match(html, /Privacy/)
    assert.doesNotMatch(html, /jackpot-api-newsletter/)
    assert.doesNotMatch(html, /\/api\/subscribe/)
  })

  it('keeps DOI browser modules free of service hostname, legacy writers, and storage', () => {
    const files = [
      'lib/newsletter/subscribe-client.ts',
      'lib/newsletter/newsletter-subscribe-controller.ts',
      'lib/newsletter/doi-copy.ts',
      'components/newsletter/DoiNewsletterSignupForm.tsx',
      'components/InlineNewsletterHero.tsx',
      'app/page.tsx',
    ]
    const forbidden = [
      'jackpot-api-newsletter',
      '/api/public/newsletter',
      '/api/subscribe',
      'email_signups',
      'consentTextVersion',
      'localStorage',
      'sessionStorage',
      'reward_access_token',
      'subscriber_email_hash',
      'SUPABASE_SERVICE_ROLE',
      'NEXT_PUBLIC_NEWSLETTER',
      'server-only',
      'newsletter-bff',
      'newsletter-service-auth',
      'newsletter-service-client',
    ]
    for (const relative of files) {
      const source = readFileSync(join(srcRoot, relative), 'utf8')
      for (const token of forbidden) {
        // Allow documenting excluded source field names only in hardening comments
        // when prefixed as "source …" — prefer exact identifier absence in code.
        if (token === 'consentTextVersion' && /consentPolicyVersion/.test(source)) {
          assert.equal(
            /\bconsentTextVersion\b/.test(source),
            false,
            `${relative} must not contain consentTextVersion`,
          )
          continue
        }
        assert.equal(
          source.includes(token),
          false,
          `${relative} must not contain ${token}`,
        )
      }
    }

    const form = readFileSync(
      join(srcRoot, 'components/newsletter/DoiNewsletterSignupForm.tsx'),
      'utf8',
    )
    assert.match(form, /acquisitionEnabled/)
    assert.match(form, /aria-live/)
    assert.equal(form.includes('dangerouslySetInnerHTML'), false)

    // idle markup smoke
    const idle = renderToStaticMarkup(createElement(DoiNewsletterSignupForm))
    assert.match(idle, /Subscribe/)
  })
})
