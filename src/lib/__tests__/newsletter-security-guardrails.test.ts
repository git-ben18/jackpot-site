import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { NEWSLETTER_ABUSE_CONTROL_POLICY } from '../newsletter/newsletter-abuse-controls'
import {
  isNewsletterAcquisitionEnabled,
  resolveNewsletterAcquisitionGate,
} from '../newsletter/newsletter-acquisition-gate'
import {
  handleConfirmConsumePost,
  handleConfirmValidatePost,
  handleSubscribePost,
  parseBrowserSubscribeBody,
} from '../newsletter/newsletter-bff'
import { NEWSLETTER_CONSENT_POLICY_VERSION } from '../newsletter/newsletter-public-contract'
import type { NewsletterServiceTransport } from '../newsletter/newsletter-service-client'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const srcRoot = join(root, 'src')
const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function validSubscribeBody() {
  return {
    email: 'visitor@example.com',
    consentAccepted: true,
    ageConfirmed: true,
    consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
    signupSource: 'newsletter_landing',
  }
}

function trackingTransport(): NewsletterServiceTransport & {
  calls: string[]
} {
  const calls: string[] = []
  return {
    calls,
    async subscribe() {
      calls.push('subscribe')
      return {
        kind: 'success',
        value: {
          ok: true,
          status: 'confirmation_if_eligible',
          message: 'Check your email to confirm your subscription.',
        },
      }
    },
    async validateConfirmation() {
      calls.push('validate')
      return { kind: 'success', value: { status: 'ready_to_confirm' } }
    },
    async confirm() {
      calls.push('confirm')
      return { kind: 'success', value: { status: 'success' } }
    },
  }
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

describe('S4-F acquisition kill switch', () => {
  it('requires explicit true-like enablement; unset/empty/unknown fail closed', () => {
    assert.equal(isNewsletterAcquisitionEnabled({}), false)
    assert.equal(
      isNewsletterAcquisitionEnabled({ NEWSLETTER_ACQUISITION_ENABLED: '' }),
      false,
    )
    assert.equal(
      isNewsletterAcquisitionEnabled({ NEWSLETTER_ACQUISITION_ENABLED: '1' }),
      true,
    )
    assert.equal(
      isNewsletterAcquisitionEnabled({ NEWSLETTER_ACQUISITION_ENABLED: 'true' }),
      true,
    )
    assert.equal(
      isNewsletterAcquisitionEnabled({ NEWSLETTER_ACQUISITION_ENABLED: '0' }),
      false,
    )
    assert.equal(
      isNewsletterAcquisitionEnabled({ NEWSLETTER_ACQUISITION_ENABLED: 'false' }),
      false,
    )
    assert.equal(
      resolveNewsletterAcquisitionGate({
        NEWSLETTER_ACQUISITION_ENABLED: 'maybe',
      }).allowed,
      false,
    )
  })

  it('subscribe kill switch returns unavailable without transport mutation', async () => {
    const transport = trackingTransport()
    const res = await handleSubscribePost(
      jsonRequest('http://localhost/api/newsletter/subscribe', validSubscribeBody()),
      {
        transport,
        isAcquisitionEnabled: () => false,
        log: { error: () => {} },
      },
    )
    assert.equal(res.status, 503)
    assert.deepEqual(await res.json(), { status: 'unavailable' })
    assert.deepEqual(transport.calls, [])
  })

  it('confirm validate/consume kill switch blocks downstream without leaking token', async () => {
    const transport = trackingTransport()
    const logs: string[] = []
    const deps = {
      transport,
      isAcquisitionEnabled: () => false,
      log: { error: (message: string) => logs.push(message) },
    }

    const validate = await handleConfirmValidatePost(
      jsonRequest('http://localhost/api/newsletter/confirm/validate', {
        token: TOKEN,
      }),
      deps,
    )
    const consume = await handleConfirmConsumePost(
      jsonRequest('http://localhost/api/newsletter/confirm', { token: TOKEN }),
      deps,
    )

    assert.equal(validate.status, 503)
    assert.deepEqual(await validate.json(), { status: 'unable_to_confirm' })
    assert.equal(consume.status, 503)
    assert.deepEqual(await consume.json(), { status: 'unable_to_confirm' })
    assert.deepEqual(transport.calls, [])
    for (const line of logs) {
      assert.doesNotMatch(line, new RegExp(TOKEN))
    }
  })

  it('kill switch does not restore legacy subscribe fallback', () => {
    const gate = readFileSync(
      join(srcRoot, 'lib/newsletter/newsletter-acquisition-gate.ts'),
      'utf8',
    )
    const bff = readFileSync(join(srcRoot, 'lib/newsletter/newsletter-bff.ts'), 'utf8')
    for (const source of [gate, bff]) {
      assert.equal(source.includes('email_signups'), false)
      assert.equal(source.includes('reward_access_token'), false)
      assert.doesNotMatch(source, /['"`]\/api\/subscribe['"`]/)
    }
  })
})

describe('S4-F abuse-control seam', () => {
  it('documents honeypot as server-authoritative and Turnstile as deferred', () => {
    assert.equal(NEWSLETTER_ABUSE_CONTROL_POLICY.honeypot.browserField, 'website')
    assert.equal(
      NEWSLETTER_ABUSE_CONTROL_POLICY.honeypot.authoritativeAt,
      'server_bff',
    )
    assert.equal(
      NEWSLETTER_ABUSE_CONTROL_POLICY.botChallenge.status,
      'deferred_hosted_acceptance',
    )
    assert.equal(
      NEWSLETTER_ABUSE_CONTROL_POLICY.botChallenge.forwardToNewsletterService,
      false,
    )
    assert.equal(NEWSLETTER_ABUSE_CONTROL_POLICY.browserOnlyChecksAuthoritative, false)
    assert.deepEqual(
      NEWSLETTER_ABUSE_CONTROL_POLICY.botChallenge.browserFieldsAccepted,
      [],
    )
  })

  it('rejects unapproved bot-challenge fields at the BFF allowlist', () => {
    assert.equal(
      parseBrowserSubscribeBody({
        ...validSubscribeBody(),
        turnstileToken: 'cf-turnstile-response',
      }).ok,
      false,
    )
    assert.equal(
      parseBrowserSubscribeBody({
        ...validSubscribeBody(),
        cfTurnstileResponse: 'x',
      }).ok,
      false,
    )
  })
})

describe('S4-F response and credential boundaries', () => {
  it('subscribe success remains non-enumerating and drops upstream message', async () => {
    const transport = trackingTransport()
    const res = await handleSubscribePost(
      jsonRequest('http://localhost/api/newsletter/subscribe', validSubscribeBody()),
      { transport, isAcquisitionEnabled: () => true },
    )
    const body = await res.json()
    assert.equal(res.status, 200)
    assert.deepEqual(body, { status: 'accepted' })
    assert.equal('message' in body, false)
    assert.equal('email' in body, false)
    assert.equal(JSON.stringify(body).includes('visitor@example.com'), false)
  })

  it('confirm responses never echo the raw token', async () => {
    const transport = trackingTransport()
    const res = await handleConfirmValidatePost(
      jsonRequest('http://localhost/api/newsletter/confirm/validate', {
        token: TOKEN,
      }),
      { transport, isAcquisitionEnabled: () => true },
    )
    const body = await res.json()
    assert.deepEqual(body, { status: 'ready_to_confirm' })
    assert.equal(JSON.stringify(body).includes(TOKEN), false)
  })

  it('client/browser newsletter modules do not import server-only boundaries', () => {
    const clientFiles = [
      'lib/newsletter/newsletter-public-contract.ts',
      'lib/newsletter/newsletter-abuse-controls.ts',
      'lib/newsletter/confirm-client.ts',
      'lib/newsletter/newsletter-confirm-controller.ts',
      'lib/newsletter/newsletter-confirm-copy.ts',
      'lib/newsletter/subscribe-client.ts',
      'lib/newsletter/newsletter-subscribe-controller.ts',
      'lib/newsletter/doi-copy.ts',
      'components/newsletter/NewsletterConfirmClient.tsx',
      'components/newsletter/DoiNewsletterSignupForm.tsx',
      'components/InlineNewsletterHero.tsx',
      'app/newsletter/confirm/page.tsx',
      'app/page.tsx',
    ]
    const serverOnlyModules = [
      'newsletter-bff',
      'newsletter-service-client',
      'newsletter-service-auth',
      'newsletter-service-env',
      'newsletter-canonical-contract',
      'newsletter-acquisition-gate',
      'server-only',
    ]
    for (const relativePath of clientFiles) {
      const source = readFileSync(join(srcRoot, relativePath), 'utf8')
      for (const token of serverOnlyModules) {
        assert.equal(
          source.includes(token),
          false,
          `${relativePath} must not reference ${token}`,
        )
      }
      assert.equal(source.includes('NEWSLETTER_SERVICE_BASE_URL'), false)
      assert.equal(source.includes('SUPABASE_SERVICE_ROLE_KEY'), false)
    }
  })

  it('does not treat scaffold /privacy as approved ACQ-05 privacy URL/version', () => {
    const form = readFileSync(
      join(srcRoot, 'components/newsletter/DoiNewsletterSignupForm.tsx'),
      'utf8',
    )
    const copy = readFileSync(join(srcRoot, 'lib/newsletter/doi-copy.ts'), 'utf8')
    assert.equal(form.includes('href="/privacy"'), false)
    assert.equal(form.includes("href='/privacy'"), false)
    assert.equal(form.includes('/privacy'), false)
    assert.match(copy, /Privacy Policy/)
  })
})

describe('S4-F active-runtime forbidden pattern search', () => {
  it('records absence of legacy persistence and secret crossover in src/', () => {
    const patterns = [
      '/api/subscribe',
      'email_signups',
      'getSupabaseAdminClient',
      'SUPABASE_SERVICE_ROLE_KEY',
      'reward_access_token',
      'access_token',
      'subscriber_email_hash',
      'NEXT_PUBLIC_NEWSLETTER',
      'NEXT_PUBLIC_NEWSLETTER_SERVICE',
      'doi-flag',
    ] as const

    const hits: Record<string, string[]> = Object.fromEntries(
      patterns.map((p) => [p, [] as string[]]),
    )

    for (const file of walkFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8')
      const rel = relative(srcRoot, file).replace(/\\/g, '/')
      for (const pattern of patterns) {
        if (!source.includes(pattern)) continue
        // Allow test files to assert forbidden strings are absent.
        if (rel.includes('__tests__/') || rel.includes('__fixtures__/')) {
          continue
        }
        hits[pattern].push(rel)
      }
    }

    for (const pattern of patterns) {
      assert.deepEqual(
        hits[pattern],
        [],
        `active runtime must not contain ${pattern}: ${hits[pattern].join(', ')}`,
      )
    }
  })

  it('keeps newsletter service hostname out of browser confirmation/UI code', () => {
    const files = [
      'components/newsletter/NewsletterConfirmClient.tsx',
      'components/newsletter/DoiNewsletterSignupForm.tsx',
      'components/InlineNewsletterHero.tsx',
      'lib/newsletter/confirm-client.ts',
      'lib/newsletter/newsletter-confirm-controller.ts',
      'lib/newsletter/subscribe-client.ts',
      'lib/newsletter/newsletter-subscribe-controller.ts',
      'lib/newsletter/doi-copy.ts',
      'app/newsletter/confirm/page.tsx',
      'app/page.tsx',
    ]
    for (const relativePath of files) {
      const source = readFileSync(join(srcRoot, relativePath), 'utf8')
      assert.equal(source.includes('jackpot-api-newsletter'), false)
      assert.equal(source.includes('/api/public/newsletter'), false)
    }
  })

  it('gate and abuse modules stay free of shared bearer / NEXT_PUBLIC secrets', () => {
    const files = [
      'lib/newsletter/newsletter-acquisition-gate.ts',
      'lib/newsletter/newsletter-abuse-controls.ts',
      'lib/newsletter/newsletter-bff.ts',
    ]
    for (const relativePath of files) {
      const source = readFileSync(join(srcRoot, relativePath), 'utf8')
      assert.equal(source.includes('NEXT_PUBLIC_'), false)
      assert.equal(source.includes('SERVICE_ROLE'), false)
      assert.equal(source.includes('SENDGRID'), false)
      assert.doesNotMatch(source, /Bearer\s+[A-Za-z0-9._-]+/)
    }
  })
})
