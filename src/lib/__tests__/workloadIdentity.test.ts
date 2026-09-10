import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { NEWSLETTER_CONSENT_POLICY_VERSION } from '../newsletter/newsletter-public-contract'
import { createHttpNewsletterServiceTransport } from '../newsletter/newsletter-service-client'
import {
  createFakeWorkloadIdentityAuth,
  createVercelOidcWorkloadIdentityAuth,
  isFakeWorkloadIdentityAllowed,
  resolveWorkloadIdentityAuth,
  WORKLOAD_IDENTITY_AUTHORIZATION_HEADER,
} from '../newsletter/newsletter-service-auth'

const newsletterRoot = join(dirname(fileURLToPath(import.meta.url)), '../newsletter')

function readNewsletterSource(relative: string): string {
  return readFileSync(join(newsletterRoot, relative), 'utf8')
}

const subscribeInput = {
  email: 'visitor@example.com',
  consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
  consentAccepted: true as const,
  ageConfirmed: true as const,
  signupSource: 'newsletter_landing' as const,
}

describe('S4-D workload identity provider', () => {
  it('allows fake identity only under explicit local/test configuration', () => {
    assert.equal(
      isFakeWorkloadIdentityAllowed({
        NODE_ENV: 'development',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
      }),
      true,
    )
  })

  it('rejects fake identity in production NODE_ENV', async () => {
    assert.equal(
      isFakeWorkloadIdentityAllowed({
        NODE_ENV: 'production',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
      }),
      false,
    )
    const auth = resolveWorkloadIdentityAuth({
      env: {
        NODE_ENV: 'production',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
        NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION: 'should-not-be-used',
      },
    })
    const result = await auth.getHeaders()
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'forbidden_in_production')
    }
  })

  it('rejects fake identity on hosted preview/production Vercel runtimes', async () => {
    for (const vercelEnv of ['preview', 'production']) {
      const auth = resolveWorkloadIdentityAuth({
        env: {
          NODE_ENV: 'development',
          VERCEL_ENV: vercelEnv,
          NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
          NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION: 'should-not-be-used',
        },
      })
      const result = await auth.getHeaders()
      assert.equal(result.ok, false)
      if (!result.ok) {
        assert.equal(result.reason, 'forbidden_in_production')
      }
    }
  })

  it('issues deterministic fake Authorization headers when explicitly enabled', async () => {
    const auth = createFakeWorkloadIdentityAuth('test-assertion-abc')
    const result = await auth.getHeaders()
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(
        result.headers[WORKLOAD_IDENTITY_AUTHORIZATION_HEADER],
        'Bearer test-assertion-abc',
      )
    }
  })

  it('uses Vercel OIDC by default and surfaces unavailable identity', async () => {
    const auth = createVercelOidcWorkloadIdentityAuth({
      getVercelOidcTokenFn: async () => {
        throw new Error('no token in local unit test')
      },
    })
    assert.equal(auth.mode, 'vercel_oidc')
    const result = await auth.getHeaders()
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'identity_unavailable')
    }
  })

  it('passes optional audience through to the OIDC acquisition helper', async () => {
    let seenAudience: string | undefined
    const auth = createVercelOidcWorkloadIdentityAuth({
      audience: 'https://newsletter.example',
      getVercelOidcTokenFn: async (opts) => {
        seenAudience = opts?.audience
        return 'oidc-token'
      },
    })
    const result = await auth.getHeaders()
    assert.equal(seenAudience, 'https://newsletter.example')
    assert.equal(result.ok, true)
  })
})

describe('S4-D integration with S4-C HTTP transport', () => {
  it('attaches server-acquired Authorization before protected newsletter calls', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const transport = createHttpNewsletterServiceTransport({
      env: {
        NODE_ENV: 'test',
        NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
        NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION: 'transport-test-token',
      },
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return new Response(
          JSON.stringify({
            ok: true,
            status: 'confirmation_if_eligible',
            message: 'Check your email to confirm.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    })

    const result = await transport.subscribe(subscribeInput)
    assert.equal(result.kind, 'success')
    assert.equal(calls.length, 1)
    const headers = calls[0].init.headers as Record<string, string>
    assert.equal(headers[WORKLOAD_IDENTITY_AUTHORIZATION_HEADER], 'Bearer transport-test-token')
  })

  it('fails closed before fetch when identity cannot be acquired', async () => {
    let fetched = false
    const transport = createHttpNewsletterServiceTransport({
      env: {
        NODE_ENV: 'test',
        NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example',
      },
      auth: createVercelOidcWorkloadIdentityAuth({
        getVercelOidcTokenFn: async () => {
          throw new Error('missing')
        },
      }),
      fetchImpl: async () => {
        fetched = true
        return new Response('{}', { status: 200 })
      },
    })

    const result = await transport.subscribe(subscribeInput)
    assert.equal(fetched, false)
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'identity_unavailable')
    }
  })

  it('fails closed when production mode requests fake identity', async () => {
    let fetched = false
    const transport = createHttpNewsletterServiceTransport({
      env: {
        NODE_ENV: 'production',
        NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
        NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION: 'prod-should-fail',
      },
      fetchImpl: async () => {
        fetched = true
        return new Response('{}', { status: 200 })
      },
    })

    const result = await transport.subscribe(subscribeInput)
    assert.equal(fetched, false)
    assert.equal(result.kind, 'unavailable')
    if (result.kind === 'unavailable') {
      assert.equal(result.cause, 'identity_unavailable')
    }
  })

  it('does not put assertion material into transport results', async () => {
    const secret = 'super-secret-assertion-value'
    const result = await createHttpNewsletterServiceTransport({
      env: {
        NODE_ENV: 'production',
        NEWSLETTER_SERVICE_BASE_URL: 'https://newsletter.example',
        NEWSLETTER_WORKLOAD_IDENTITY_MODE: 'fake',
        NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION: secret,
      },
      fetchImpl: async () => new Response('{}', { status: 200 }),
    }).subscribe(subscribeInput)

    assert.equal(result.kind, 'unavailable')
    assert.doesNotMatch(JSON.stringify(result), new RegExp(secret))
    assert.doesNotMatch(JSON.stringify(result), /Bearer /)
  })
})

describe('S4-D source guardrails', () => {
  const files = [
    'newsletter-service-auth.ts',
    'newsletter-service-client.ts',
    'newsletter-service-env.ts',
    'newsletter-bff.ts',
  ]

  it('keeps identity on the server side without NEXT_PUBLIC / service-role / shared bearer', () => {
    for (const file of files) {
      const source = readNewsletterSource(file)
      assert.match(source, /import 'server-only'/)
      assert.doesNotMatch(source, /process\.env\.NEXT_PUBLIC_|env\.NEXT_PUBLIC_/)
      assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|service_role|getSupabaseAdminClient/)
      assert.doesNotMatch(source, /SHARED_BEARER|FALLBACK_BEARER|NEWSLETTER_SHARED_SECRET/)
    }
  })

  it('wires live transport to resolveWorkloadIdentityAuth rather than deferred-only default', () => {
    const client = readNewsletterSource('newsletter-service-client.ts')
    const bff = readNewsletterSource('newsletter-bff.ts')
    assert.match(client, /resolveWorkloadIdentityAuth/)
    assert.match(bff, /resolveWorkloadIdentityAuth/)
    assert.doesNotMatch(client, /createDeferredWorkloadIdentityAuth\(\)/)
  })

  it('does not invent a long-lived fallback bearer path', () => {
    const auth = readNewsletterSource('newsletter-service-auth.ts')
    assert.match(auth, /vercel_oidc/)
    assert.match(auth, /fake_test/)
    assert.doesNotMatch(auth, /shared.?secret|static.?bearer/i)
  })

  it('never forwards browser Authorization into the HTTP transport API', () => {
    const client = readNewsletterSource('newsletter-service-client.ts')
    assert.doesNotMatch(client, /input\.headers|request\.headers|browserAuth|forwardAuth/i)
    assert.match(client, /headersResult\.headers/)
  })
})
