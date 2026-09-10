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
import { createNewsletterConfirmController } from '../newsletter/newsletter-confirm-controller'
import NewsletterConfirmClient from '../../components/newsletter/NewsletterConfirmClient'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function waitFor(
  controller: ReturnType<typeof createNewsletterConfirmController>,
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
    assert.equal((calls[0].init.body as string).includes(TOKEN), true)
  })

  it('does not treat source synonym valid as ready_to_confirm', async () => {
    const status = await validateConfirmToken(TOKEN, {
      fetchImpl: async () => jsonResponse(200, { status: 'valid' }),
    })
    assert.equal(status, 'unable_to_confirm')
  })

  it('rejects HTTP 202 even with a success-shaped body (S4-C returns 200)', async () => {
    assert.equal(
      await validateConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(202, { status: 'ready_to_confirm' }),
      }),
      'unable_to_confirm',
    )
    assert.equal(
      await consumeConfirmToken(TOKEN, {
        fetchImpl: async () => jsonResponse(202, { status: 'success' }),
      }),
      'unable_to_confirm',
    )
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
  })
})

describe('S4-E confirmation controller behavior', () => {
  it('validates on start, cleans URL, and reaches ready_to_confirm', async () => {
    const replaced: string[] = []
    const calls: string[] = []
    const controller = createNewsletterConfirmController({
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: (path) => {
        replaced.push(path)
      },
      fetchImpl: async (url) => {
        calls.push(String(url))
        return jsonResponse(200, { status: 'ready_to_confirm' })
      },
    })

    await controller.start()
    await waitFor(controller, () => controller.getPhase() === 'ready_to_confirm', 'ready')
    assert.deepEqual(replaced, [NEWSLETTER_CONFIRM_PATH])
    assert.deepEqual(calls, [NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH])
    assert.equal(controller.hasToken(), true)
    controller.dispose()
  })

  it('missing token is invalid without network and cleans URL', async () => {
    let fetched = false
    const replaced: string[] = []
    const controller = createNewsletterConfirmController({
      getSearch: () => '',
      replaceUrl: (path) => {
        replaced.push(path)
      },
      fetchImpl: async () => {
        fetched = true
        return jsonResponse(200, { status: 'ready_to_confirm' })
      },
    })
    await controller.start()
    assert.equal(controller.getPhase(), 'invalid_or_unusable')
    assert.equal(fetched, false)
    assert.equal(controller.hasToken(), false)
    assert.deepEqual(replaced, [NEWSLETTER_CONFIRM_PATH])
    controller.dispose()
  })

  it('confirm invokes consume once and ignores repeated in-flight clicks', async () => {
    let releaseConsume!: (value: Response) => void
    const consumeGate = new Promise<Response>((resolve) => {
      releaseConsume = resolve
    })
    const calls: string[] = []
    const controller = createNewsletterConfirmController({
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async (url) => {
        const path = String(url)
        calls.push(path)
        if (path === NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH) {
          return jsonResponse(200, { status: 'ready_to_confirm' })
        }
        return consumeGate
      },
    })

    await controller.start()
    await waitFor(controller, () => controller.getPhase() === 'ready_to_confirm', 'ready')

    const first = controller.confirm()
    const second = controller.confirm()
    await waitFor(controller, () => controller.getPhase() === 'submitting', 'submitting')

    releaseConsume(jsonResponse(200, { status: 'success' }))
    await Promise.all([first, second])
    await waitFor(controller, () => controller.getPhase() === 'success', 'success')

    assert.equal(
      calls.filter((path) => path === NEWSLETTER_CONFIRM_CONSUME_BFF_PATH).length,
      1,
    )
    assert.equal(controller.hasToken(), false)
    controller.dispose()
  })

  it('maps success / already_complete / invalid / unable to bounded product copy', async () => {
    assert.match(NEWSLETTER_CONFIRM_COPY.success, /subscription|confirmed/i)
    assert.match(NEWSLETTER_CONFIRM_COPY.alreadyComplete, /already complete/i)
    assert.match(NEWSLETTER_CONFIRM_COPY.invalid, /invalid|no longer usable/i)
    assert.match(NEWSLETTER_CONFIRM_COPY.unable, /unable to confirm/i)

    const validateTerminal = [
      {
        status: 'already_complete' as const,
        copy: NEWSLETTER_CONFIRM_COPY.alreadyComplete,
        retainToken: false,
      },
      {
        status: 'invalid_or_unusable' as const,
        copy: NEWSLETTER_CONFIRM_COPY.invalid,
        retainToken: false,
      },
      {
        status: 'unable_to_confirm' as const,
        copy: NEWSLETTER_CONFIRM_COPY.unable,
        retainToken: true,
      },
    ]

    for (const item of validateTerminal) {
      const controller = createNewsletterConfirmController({
        getSearch: () => `?token=${TOKEN}`,
        replaceUrl: () => {},
        fetchImpl: async () => jsonResponse(200, { status: item.status }),
      })
      await controller.start()
      await waitFor(controller, () => controller.getPhase() === item.status, item.status)
      assert.equal(controller.hasToken(), item.retainToken)
      assert.doesNotMatch(item.copy, new RegExp(TOKEN))
      controller.dispose()
    }

    const consumeTerminal = [
      { status: 'success' as const, copy: NEWSLETTER_CONFIRM_COPY.success },
      {
        status: 'already_complete' as const,
        copy: NEWSLETTER_CONFIRM_COPY.alreadyComplete,
      },
    ]

    for (const item of consumeTerminal) {
      const controller = createNewsletterConfirmController({
        getSearch: () => `?token=${TOKEN}`,
        replaceUrl: () => {},
        fetchImpl: async (url) => {
          if (String(url) === NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH) {
            return jsonResponse(200, { status: 'ready_to_confirm' })
          }
          return jsonResponse(200, { status: item.status })
        },
      })
      await controller.start()
      await waitFor(controller, () => controller.getPhase() === 'ready_to_confirm', 'ready')
      await controller.confirm()
      await waitFor(controller, () => controller.getPhase() === item.status, item.status)
      assert.equal(controller.hasToken(), false)
      assert.doesNotMatch(item.copy, new RegExp(TOKEN))
      controller.dispose()
    }
  })

  it('manual retry re-validates before another consume and can recover to ready', async () => {
    const calls: string[] = []
    let validateCount = 0
    const controller = createNewsletterConfirmController({
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async (url) => {
        const path = String(url)
        calls.push(path)
        if (path === NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH) {
          validateCount += 1
          if (validateCount === 1) {
            return jsonResponse(200, { status: 'unable_to_confirm' })
          }
          return jsonResponse(200, { status: 'ready_to_confirm' })
        }
        return jsonResponse(200, { status: 'success' })
      },
    })

    await controller.start()
    await waitFor(
      controller,
      () => controller.getPhase() === 'unable_to_confirm',
      'unable',
    )
    assert.equal(controller.hasToken(), true)

    await controller.retry()
    await waitFor(controller, () => controller.getPhase() === 'ready_to_confirm', 'ready')
    assert.equal(validateCount, 2)
    assert.equal(
      calls.filter((path) => path === NEWSLETTER_CONFIRM_CONSUME_BFF_PATH).length,
      0,
    )

    await controller.confirm()
    await waitFor(controller, () => controller.getPhase() === 'success', 'success')
    assert.equal(
      calls.filter((path) => path === NEWSLETTER_CONFIRM_CONSUME_BFF_PATH).length,
      1,
    )
    controller.dispose()
  })

  it('clears token on dispose/unmount', async () => {
    const controller = createNewsletterConfirmController({
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async () => jsonResponse(200, { status: 'ready_to_confirm' }),
    })
    await controller.start()
    await waitFor(controller, () => controller.getPhase() === 'ready_to_confirm', 'ready')
    assert.equal(controller.hasToken(), true)
    controller.dispose()
    assert.equal(controller.hasToken(), false)
  })

  it('never exposes the raw token through phase transitions used for UI copy', async () => {
    const controller = createNewsletterConfirmController({
      getSearch: () => `?token=${TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async () => jsonResponse(200, { status: 'ready_to_confirm' }),
    })
    await controller.start()
    await waitFor(controller, () => controller.getPhase() === 'ready_to_confirm', 'ready')
    assert.doesNotMatch(controller.getPhase(), new RegExp(TOKEN))
    assert.equal(NEWSLETTER_CONFIRM_COPY.button.includes(TOKEN), false)
    controller.dispose()
  })
})

describe('S4-E NewsletterConfirmClient presentation', () => {
  it('renders loading state initially without exposing a token', () => {
    const html = renderToStaticMarkup(createElement(NewsletterConfirmClient))
    assert.match(html, new RegExp(NEWSLETTER_CONFIRM_COPY.heading))
    assert.match(html, new RegExp(NEWSLETTER_CONFIRM_COPY.loading))
    assert.doesNotMatch(html, new RegExp(TOKEN))
    assert.match(html, /role="status"/)
    assert.match(html, /aria-live="polite"/)
    assert.match(html, /tabindex="-1"/)
  })

  it('keeps confirmation browser modules free of service hostname, logs, and legacy writers', () => {
    const files = [
      'lib/newsletter/confirm-client.ts',
      'lib/newsletter/newsletter-confirm-copy.ts',
      'lib/newsletter/newsletter-confirm-controller.ts',
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

    const ui = readFileSync(
      join(srcRoot, 'components/newsletter/NewsletterConfirmClient.tsx'),
      'utf8',
    )
    assert.match(ui, /history\.replaceState/)
    assert.match(ui, /focusTargetForPhase|\.focus\(/)
    assert.match(ui, /retry/)
    assert.match(ui, /aria-live/)

    const client = readFileSync(join(srcRoot, 'lib/newsletter/confirm-client.ts'), 'utf8')
    assert.match(client, /status === 200/)
    assert.doesNotMatch(client, /status !== 200 && status !== 202/)

    const controllerSource = readFileSync(
      join(srcRoot, 'lib/newsletter/newsletter-confirm-controller.ts'),
      'utf8',
    )
    assert.doesNotMatch(controllerSource, /peekToken|getToken|rawToken/)
  })
})
