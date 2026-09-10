import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  consumeConfirmToken,
  NEWSLETTER_CONFIRM_CONSUME_BFF_PATH,
  NEWSLETTER_CONFIRM_PATH,
  NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH,
  validateConfirmToken,
} from '../newsletter/confirm-client'
import { NEWSLETTER_CONFIRM_COPY } from '../newsletter/newsletter-confirm-copy'
import NewsletterConfirmClient from '../../components/newsletter/NewsletterConfirmClient'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('S4-E confirm-client', () => {
  it('missing token returns invalid_or_unusable without network', async () => {
    let fetched = false
    const status = await validateConfirmToken('', {
      fetchImpl: async () => {
        fetched = true
        return jsonResponse(200, { status: 'ready_to_confirm' })
      },
    })
    assert.equal(status, 'invalid_or_unusable')
    assert.equal(fetched, false)
  })

  it('validate uses only same-origin BFF path and maps ready_to_confirm', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const status = await validateConfirmToken(TOKEN, {
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })
        return jsonResponse(200, { status: 'ready_to_confirm' })
      },
    })
    assert.equal(status, 'ready_to_confirm')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH)
    assert.equal(calls[0].init.method, 'POST')
    assert.equal(
      (calls[0].init.body as string).includes(TOKEN),
      true,
    )
  })

  it('does not treat source synonym valid as ready_to_confirm', async () => {
    const status = await validateConfirmToken(TOKEN, {
      fetchImpl: async () => jsonResponse(200, { status: 'valid' }),
    })
    assert.equal(status, 'unable_to_confirm')
  })

  it('maps already_complete / invalid_or_unusable / unable_to_confirm on validate', async () => {
    for (const expected of [
      'already_complete',
      'invalid_or_unusable',
      'unable_to_confirm',
    ] as const) {
      const status = await validateConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(200, { status: expected }),
      })
      assert.equal(status, expected)
    }
  })

  it('unknown or malformed validate 2xx fails closed', async () => {
    assert.equal(
      await validateConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(200, { status: 'mystery' }),
      }),
      'unable_to_confirm',
    )
    assert.equal(
      await validateConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(200, { ok: true }),
      }),
      'unable_to_confirm',
    )
    assert.equal(
      await validateConfirmToken(TOKEN, {
        fetchImpl: async () =>
          new Response('not-json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      }),
      'unable_to_confirm',
    )
  })

  it('consume uses only same-origin confirm route and maps success', async () => {
    const calls: string[] = []
    const status = await consumeConfirmToken(TOKEN, {
      fetchImpl: async (url) => {
        calls.push(String(url))
        return jsonResponse(200, { status: 'success' })
      },
    })
    assert.equal(status, 'success')
    assert.deepEqual(calls, [NEWSLETTER_CONFIRM_CONSUME_BFF_PATH])
  })

  it('consume maps already_complete and fails closed on unknown status', async () => {
    assert.equal(
      await consumeConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(200, { status: 'already_complete' }),
      }),
      'already_complete',
    )
    assert.equal(
      await consumeConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(200, { status: 'ready_to_confirm' }),
      }),
      'unable_to_confirm',
    )
  })

  it('network failures map to unable_to_confirm', async () => {
    assert.equal(
      await validateConfirmToken(TOKEN, {
        fetchImpl: async () => {
          throw new Error('offline')
        },
      }),
      'unable_to_confirm',
    )
    assert.equal(
      await consumeConfirmToken(TOKEN, {
        fetchImpl: async () => {
          throw new Error('offline')
        },
      }),
      'unable_to_confirm',
    )
  })
})

describe('S4-E NewsletterConfirmClient', () => {
  it('renders loading state initially without exposing a token', () => {
    const html = renderToStaticMarkup(createElement(NewsletterConfirmClient))
    assert.match(html, new RegExp(NEWSLETTER_CONFIRM_COPY.heading))
    assert.match(html, new RegExp(NEWSLETTER_CONFIRM_COPY.loading))
    assert.doesNotMatch(html, new RegExp(TOKEN))
    assert.match(html, /role="status"/)
  })

  it('keeps confirmation browser modules free of service hostname and legacy writers', () => {
    const files = [
      'lib/newsletter/confirm-client.ts',
      'lib/newsletter/newsletter-confirm-copy.ts',
      'components/newsletter/NewsletterConfirmClient.tsx',
      'app/newsletter/confirm/page.tsx',
    ]
    const forbidden = [
      'jackpot-api-newsletter',
      '/api/public/newsletter',
      '/api/subscribe',
      'email_signups',
      'consentTextVersion',
      'localStorage',
      'sessionStorage',
      'console.log',
      'console.info',
      'console.debug',
      'console.error',
      'console.warn',
    ]
    for (const relative of files) {
      const source = readFileSync(join(srcRoot, relative), 'utf8')
      for (const token of forbidden) {
        assert.equal(
          source.includes(token),
          false,
          `${relative} must not contain ${token}`,
        )
      }
    }

    const client = readFileSync(
      join(srcRoot, 'lib/newsletter/confirm-client.ts'),
      'utf8',
    )
    assert.match(client, /ready_to_confirm/)
    assert.match(client, /statusFromBody/)
    assert.doesNotMatch(client, /body\.outcome/)
    assert.doesNotMatch(client, /=== 'valid'/)
    assert.match(client, /NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH/)
    assert.match(client, /NEWSLETTER_CONFIRM_CONSUME_BFF_PATH/)

    const ui = readFileSync(
      join(srcRoot, 'components/newsletter/NewsletterConfirmClient.tsx'),
      'utf8',
    )
    assert.match(ui, /history\.replaceState/)
    assert.match(ui, /NEWSLETTER_CONFIRM_PATH/)
    assert.equal(NEWSLETTER_CONFIRM_PATH, '/newsletter/confirm')
    assert.match(ui, /consumeLock/)
  })
})
