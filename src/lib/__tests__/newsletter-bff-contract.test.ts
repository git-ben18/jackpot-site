import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import {
  handleConfirmConsumePost,
  handleConfirmValidatePost,
  handleSubscribePost,
  methodNotAllowedConfirmConsume,
  methodNotAllowedConfirmValidate,
  parseBrowserConfirmBody,
  parseBrowserSubscribeBody,
} from '../newsletter/newsletter-bff'
import {
  NEWSLETTER_CONSENT_POLICY_VERSION,
  NEWSLETTER_CHECK_EMAIL_COPY,
} from '../newsletter/newsletter-public-contract'
import { translateBrowserSubscribeToCanonical } from '../newsletter/newsletter-canonical-contract'
import { createDeferredWorkloadIdentityAuth } from '../newsletter/newsletter-service-auth'
import {
  createHttpNewsletterServiceTransport,
  type NewsletterServiceTransport,
  type SubscribeTransportResult,
} from '../newsletter/newsletter-service-client'

const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'

function jsonRequest(body: unknown, extra: RequestInit = {}): Request {
  return new Request('http://localhost/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...extra,
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

function recordingTransport(
  subscribe: SubscribeTransportResult = {
    kind: 'success',
    value: {
      ok: true,
      status: 'confirmation_if_eligible',
      message: NEWSLETTER_CHECK_EMAIL_COPY,
    },
  },
): NewsletterServiceTransport & { subscribeCalls: unknown[] } {
  const subscribeCalls: unknown[] = []
  return {
    subscribeCalls,
    async subscribe(input) {
      subscribeCalls.push(input)
      return subscribe
    },
    async validateConfirmation() {
      return {
        kind: 'success',
        value: { status: 'ready_to_confirm' },
      }
    },
    async confirm() {
      return { kind: 'success', value: { status: 'success' } }
    },
  }
}

describe('parseBrowserSubscribeBody', () => {
  it('rejects extra unapproved fields', () => {
    const parsed = parseBrowserSubscribeBody({
      ...validSubscribeBody(),
      turnstileToken: 'nope',
    })
    assert.equal(parsed.ok, false)
  })

  it('rejects source consentTextVersion', () => {
    const parsed = parseBrowserSubscribeBody({
      ...validSubscribeBody(),
      consentTextVersion: 'newsletter_doi_v1',
    })
    assert.equal(parsed.ok, false)
  })

  it('rejects unapproved signup sources', () => {
    const parsed = parseBrowserSubscribeBody({
      ...validSubscribeBody(),
      signupSource: 'rewards_gate',
    })
    assert.equal(parsed.ok, false)
  })
})

describe('parseBrowserSubscribeBody honeypot field', () => {
  it('accepts empty optional website honeypot and strips it from the parsed value', () => {
    const parsed = parseBrowserSubscribeBody({
      ...validSubscribeBody(),
      website: '',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.honeypotTriggered, false)
    assert.equal('website' in parsed.value, false)
  })
})

describe('translateBrowserSubscribeToCanonical', () => {
  it('maps approved browser DTO exactly and omits honeypot', () => {
    const parsed = parseBrowserSubscribeBody(validSubscribeBody())
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    const canonical = translateBrowserSubscribeToCanonical(parsed.value)
    assert.deepEqual(canonical, {
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal('website' in canonical, false)
  })

  it('never forwards website even when present on the browser DTO object', () => {
    const canonical = translateBrowserSubscribeToCanonical({
      ...validSubscribeBody(),
      consentAccepted: true,
      ageConfirmed: true,
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      signupSource: 'newsletter_landing',
      website: '',
    })
    assert.equal('website' in canonical, false)
    assert.deepEqual(Object.keys(canonical).sort(), [
      'ageConfirmed',
      'consentAccepted',
      'consentPolicyVersion',
      'email',
      'signupSource',
    ])
  })
})

describe('handleSubscribePost', () => {
  it('returns accepted without enumerating and without leaking service status', async () => {
    const transport = recordingTransport()
    const response = await handleSubscribePost(jsonRequest(validSubscribeBody()), {
      transport,
    })
    assert.equal(response.status, 200)
    const json = await response.json()
    assert.deepEqual(json, { status: 'accepted' })
    assert.equal(JSON.stringify(json).includes('confirmation_if_eligible'), false)
    assert.equal(transport.subscribeCalls.length, 1)
  })

  it('does not call upstream when honeypot is filled', async () => {
    const transport = recordingTransport()
    const response = await handleSubscribePost(
      jsonRequest({ ...validSubscribeBody(), website: 'http://spam.example' }),
      { transport },
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'accepted' })
    assert.equal(transport.subscribeCalls.length, 0)
  })

  it('maps rate_limited and does not echo upstream messages', async () => {
    const transport = recordingTransport({
      kind: 'error',
      error: { ok: false, error: 'rate_limited', message: 'secret-db-detail' },
    })
    const response = await handleSubscribePost(jsonRequest(validSubscribeBody()), {
      transport,
    })
    assert.equal(response.status, 429)
    const json = await response.json()
    assert.deepEqual(json, { status: 'rate_limited' })
    assert.equal(JSON.stringify(json).includes('secret-db-detail'), false)
  })

  it('fails closed on unknown 2xx backend status', async () => {
    const transport = recordingTransport({
      kind: 'unavailable',
      cause: 'unknown_status',
    })
    const response = await handleSubscribePost(jsonRequest(validSubscribeBody()), {
      transport,
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
  })

  it('maps timeout/network to unavailable', async () => {
    const transport = recordingTransport({
      kind: 'unavailable',
      cause: 'timeout',
    })
    const response = await handleSubscribePost(jsonRequest(validSubscribeBody()), {
      transport,
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
  })
})

describe('confirm handlers', () => {
  it('maps validate statuses exhaustively and never logs the token', async () => {
    const logs: string[] = []
    const transport: NewsletterServiceTransport = {
      async subscribe() {
        return { kind: 'unavailable', cause: 'network' }
      },
      async validateConfirmation() {
        return { kind: 'success', value: { status: 'ready_to_confirm' } }
      },
      async confirm() {
        return { kind: 'success', value: { status: 'success' } }
      },
    }

    const response = await handleConfirmValidatePost(
      jsonRequest({ token: TOKEN }),
      { transport, log: { error: (message) => logs.push(message) } },
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ready_to_confirm' })
    assert.equal(logs.join('').includes(TOKEN), false)
  })

  it('fails closed on unexpected confirm consume bodies', async () => {
    const logs: string[] = []
    const transport: NewsletterServiceTransport = {
      async subscribe() {
        return { kind: 'unavailable', cause: 'network' }
      },
      async validateConfirmation() {
        return { kind: 'success', value: { status: 'ready_to_confirm' } }
      },
      async confirm() {
        return { kind: 'unavailable', cause: 'unknown_status' }
      },
    }
    const response = await handleConfirmConsumePost(jsonRequest({ token: TOKEN }), {
      transport,
      log: { error: (message) => logs.push(message) },
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unable_to_confirm' })
    assert.equal(logs.join('').includes(TOKEN), false)
  })

  it('rejects extra confirm fields', () => {
    assert.equal(parseBrowserConfirmBody({ token: TOKEN, extra: true }).ok, false)
  })

  it('GET never consumes a token', async () => {
    const response = methodNotAllowedConfirmConsume()
    assert.equal(response.status, 405)
    assert.deepEqual(await response.json(), { status: 'invalid_or_unusable' })
  })

  it('GET validate is not ready_to_confirm', async () => {
    const response = methodNotAllowedConfirmValidate()
    assert.equal(response.status, 405)
    assert.deepEqual(await response.json(), { status: 'invalid_or_unusable' })
  })
})

describe('HTTP transport', () => {
  it('does not fetch when identity is unavailable', async () => {
    let fetched = false
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: createDeferredWorkloadIdentityAuth(),
      fetchImpl: async () => {
        fetched = true
        return new Response('{}', { status: 200 })
      },
    })
    const result = await transport.subscribe({
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal(fetched, false)
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'identity_unavailable')
    }
  })

  it('maps 401/403 to unavailable without exposing auth details', async () => {
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: 'oidc-debug', token: 'leak' }), {
          status: 401,
        }),
    })
    const result = await transport.subscribe({
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'unauthorized')
    }

    const response = await handleSubscribePost(jsonRequest(validSubscribeBody()), {
      transport,
    })
    const json = await response.json()
    assert.deepEqual(json, { status: 'unavailable' })
    assert.equal(JSON.stringify(json).includes('oidc-debug'), false)
    assert.equal(JSON.stringify(json).includes('Bearer'), false)
  })

  it('fails closed on malformed upstream JSON', async () => {
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () => new Response('not-json', { status: 200 }),
    })
    const result = await transport.subscribe({
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'malformed')
    }
  })

  it('ignores success-shaped subscribe bodies when HTTP status is not 2xx', async () => {
    const successBody = {
      ok: true,
      status: 'confirmation_if_eligible',
      message: NEWSLETTER_CHECK_EMAIL_COPY,
    }
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () =>
        new Response(JSON.stringify(successBody), { status: 500 }),
    })
    const result = await transport.subscribe({
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'unknown_status')
    }

    const response = await handleSubscribePost(jsonRequest(validSubscribeBody()), {
      transport,
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
  })

  it('accepts subscribe error bodies only on non-2xx HTTP status', async () => {
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ ok: false, error: 'rate_limited', message: 'slow down' }),
          { status: 429 },
        ),
    })
    const result = await transport.subscribe({
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal(result.kind, 'error')
    if (result.kind === 'error') {
      assert.equal(result.error.error, 'rate_limited')
    }
  })

  it('fails closed when subscribe returns error-shaped body on 2xx', async () => {
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ ok: false, error: 'invalid_email' }),
          { status: 200 },
        ),
    })
    const result = await transport.subscribe({
      email: 'visitor@example.com',
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: 'newsletter_landing',
    })
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'unknown_status')
    }
  })

  it('ignores confirm validate success-shaped bodies on non-2xx', async () => {
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () =>
        new Response(JSON.stringify({ status: 'ready_to_confirm' }), {
          status: 503,
        }),
    })
    const result = await transport.validateConfirmation({ token: TOKEN })
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'unknown_status')
    }
  })

  it('ignores confirm consume success-shaped bodies on non-2xx', async () => {
    const transport = createHttpNewsletterServiceTransport({
      env: { NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example' },
      auth: {
        async getHeaders() {
          return { ok: true, headers: { Authorization: 'Bearer test-only' } }
        },
      },
      fetchImpl: async () =>
        new Response(JSON.stringify({ status: 'success' }), { status: 500 }),
    })
    const result = await transport.confirm({ token: TOKEN })
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'unknown_status')
    }

    const response = await handleConfirmConsumePost(jsonRequest({ token: TOKEN }), {
      transport,
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unable_to_confirm' })
  })
})

describe('source boundary', () => {
  it('browser contract module does not import server transport or env', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/lib/newsletter/newsletter-public-contract.ts'),
      'utf8',
    )
    assert.equal(source.includes('server-only'), false)
    assert.equal(source.includes('newsletter-service-client'), false)
    assert.equal(source.includes('NEWSLETTER_SERVICE_BASE_URL'), false)
  })

  it('BFF implementation does not restore legacy persistence or subscribe fallback', () => {
    const files = [
      'src/lib/newsletter/newsletter-bff.ts',
      'src/lib/newsletter/newsletter-service-client.ts',
      'src/app/api/newsletter/subscribe/route.ts',
      'src/app/api/newsletter/confirm/route.ts',
      'src/app/api/newsletter/confirm/validate/route.ts',
    ]
    for (const relative of files) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8')
      assert.equal(source.includes('email_signups'), false, relative)
      assert.equal(source.includes('api/subscribe'), false, relative)
    }
  })
})
