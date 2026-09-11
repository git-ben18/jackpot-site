/**
 * S5-F telemetry implementation guardrails — seam, consent, instrumentation, legacy audit.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import React, { createElement } from 'react'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'

import { createAnalyticsConsentController } from '../consent/analytics-consent-controller'
import { mapFixtureCuratedPromos } from '../__fixtures__/curatedPromoDiscoveryDto.fixtures'
import { createNewsletterConfirmController } from '../newsletter/newsletter-confirm-controller'
import { createNewsletterSubscribeController } from '../newsletter/newsletter-subscribe-controller'
import {
  createFirstReleaseTelemetrySeam,
  type FirstReleaseTelemetrySeam,
} from '../telemetry/first-release-telemetry-seam'
import {
  createNoopTelemetryTransport,
  createRecordingTelemetryTransport,
  createThrowingTelemetryTransport,
} from '../telemetry/first-release-telemetry-transport'
import { setFirstReleaseTelemetryForTests } from '../telemetry/first-release-telemetry-runtime'
import {
  TELEMETRY_PROHIBITED_PAYLOAD_KEYS,
  type TelemetryFilterOptionVocabulary,
} from '../telemetry/first-release-telemetry-contract'
import CuratedPromoDiscoveryWidget from '../../components/v2/curated-promos/CuratedPromoDiscoveryWidget'
import CuratedPromoDetailSheet from '../../components/v2/curated-promos/CuratedPromoDetailSheet'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const srcRoot = join(rootDir, 'src')
const fixturePromos = mapFixtureCuratedPromos()

const SAMPLE_VOCAB: TelemetryFilterOptionVocabulary = {
  brands: ['Hard Rock', 'Resorts World', 'Venetian'],
  marketSlugs: ['las-vegas'],
  signalCategories: ['room_discount', 'dining_food'],
  signalTypesForCategory: ['room_rate_percent_off'],
}

function installDom() {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Node: globalThis.Node,
    navigator: globalThis.navigator,
    IS_REACT_ACT_ENVIRONMENT: (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT,
  }
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
  })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window })
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
  const elementProto = dom.window.HTMLElement.prototype as HTMLElement & {
    attachEvent?: unknown
  }
  if (!elementProto.attachEvent) {
    elementProto.attachEvent = () => {}
  }
  return () => {
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
  }
}

function createAuthorizedSeam(
  transport = createRecordingTelemetryTransport(),
): {
  seam: FirstReleaseTelemetrySeam
  transport: ReturnType<typeof createRecordingTelemetryTransport>
  consent: ReturnType<typeof createAnalyticsConsentController>
} {
  const consent = createAnalyticsConsentController({
    initialState: 'analytics_accepted',
    sinkStatus: 'authorized',
  })
  const seam = createFirstReleaseTelemetrySeam({ consent, transport })
  return { seam, transport, consent }
}

afterEach(() => {
  setFirstReleaseTelemetryForTests(null)
})

describe('S5-F telemetry seam consent and validation', () => {
  it('unknown and rejected consent yield zero transport calls', () => {
    const transport = createRecordingTelemetryTransport()
    for (const initialState of ['unknown', 'essential_only'] as const) {
      transport.clear()
      const consent = createAnalyticsConsentController({
        initialState,
        sinkStatus: 'authorized',
      })
      const seam = createFirstReleaseTelemetrySeam({ consent, transport })
      const result = seam.emitApprovedEvent('curated_promo_discovery_view', {})
      assert.equal(result.ok, true)
      assert.equal(result.emitted, false)
      assert.equal(transport.getSent().length, 0)
    }
  })

  it('accepted + authorized emits only approved event and payload', () => {
    const { seam, transport } = createAuthorizedSeam()
    const result = seam.emitApprovedEvent('curated_promo_discovery_view', {
      email: 'should-strip@example.com',
      metadata: { x: 1 },
    })
    assert.equal(result.ok, true)
    assert.equal(result.emitted, true)
    assert.equal(transport.getSent().length, 1)
    assert.deepEqual(transport.getSent()[0], {
      name: 'curated_promo_discovery_view',
      schemaVersion: 'v1',
      payload: {},
    })
  })

  it('revocation suppresses later optional emissions', () => {
    const { seam, transport, consent } = createAuthorizedSeam()
    assert.equal(
      seam.emitApprovedEvent('curated_promo_discovery_view', {}).emitted,
      true,
    )
    consent.revokeAnalytics()
    transport.clear()
    const later = seam.emitApprovedEvent('curated_promo_card_open', {
      promoId: 'promo_1',
    })
    assert.equal(later.emitted, false)
    assert.equal(transport.getSent().length, 0)
  })

  it('rejects unknown events and does not call transport', () => {
    const { seam, transport } = createAuthorizedSeam()
    const result = seam.emitApprovedEvent(
      'session_logs' as 'curated_promo_discovery_view',
      {},
    )
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.reason, 'unknown_event')
    assert.equal(transport.getSent().length, 0)
  })

  it('rejects or strips invalid / extra payload fields per contract', () => {
    const { seam, transport } = createAuthorizedSeam()

    const badPromo = seam.emitApprovedEvent('curated_promo_card_open', {
      promoId: 'https://evil.example/?token=abc',
      sourceUrl: 'https://evil.example',
    })
    assert.equal(badPromo.ok, false)
    if (!badPromo.ok) assert.equal(badPromo.reason, 'invalid_payload')

    const badFilter = seam.emitApprovedEvent(
      'curated_promo_filter_click',
      {
        filterKey: 'brand',
        action: 'apply',
        filterValue: 'Not In Vocabulary',
        email: 'x@y.com',
      },
      { filterVocabulary: SAMPLE_VOCAB },
    )
    assert.equal(badFilter.ok, false)

    const multiWord = seam.emitApprovedEvent(
      'curated_promo_filter_click',
      {
        filterKey: 'brand',
        action: 'apply',
        filterValue: 'Hard Rock',
        referrer: 'https://leak.example',
      },
      { filterVocabulary: SAMPLE_VOCAB },
    )
    assert.equal(multiWord.emitted, true)
    assert.deepEqual(transport.getSent().at(-1)?.payload, {
      filterKey: 'brand',
      action: 'apply',
      filterValue: 'Hard Rock',
    })
  })

  it('keeps email, hash, token, URL, and referrer out of emitted payloads', () => {
    const { seam, transport } = createAuthorizedSeam()
    seam.emitApprovedEvent('newsletter_subscribe_requested', {
      signupSource: 'newsletter_landing',
      email: 'visitor@example.com',
      token: 'secret',
      referrer: 'https://ref.example',
      sourceUrl: 'https://src.example',
    })
    const payload = transport.getSent()[0]?.payload as Record<string, unknown>
    assert.deepEqual(payload, { signupSource: 'newsletter_landing' })
    const serialized = JSON.stringify(transport.getSent())
    for (const key of [
      'email',
      'token',
      'referrer',
      'sourceUrl',
      'visitor@example.com',
      'https://',
    ]) {
      assert.equal(serialized.includes(key), false, key)
    }
    for (const key of TELEMETRY_PROHIBITED_PAYLOAD_KEYS) {
      assert.equal(Object.prototype.hasOwnProperty.call(payload, key), false, key)
    }
  })

  it('uses an explicit noop/disabled sink and never invents a production provider', () => {
    const consent = createAnalyticsConsentController({
      initialState: 'analytics_accepted',
      sinkStatus: 'disabled_by_default',
    })
    const transport = createNoopTelemetryTransport()
    assert.equal(transport.kind, 'noop')
    const seam = createFirstReleaseTelemetrySeam({ consent, transport })
    assert.equal(seam.getTransportKind(), 'noop')
    const result = seam.emitApprovedEvent('curated_promo_discovery_view', {})
    assert.equal(result.emitted, false)
    if (result.ok && !result.emitted) {
      assert.equal(result.reason, 'sink_disabled')
    }
  })

  it('transport failure never changes product outcome', async () => {
    const consent = createAnalyticsConsentController({
      initialState: 'analytics_accepted',
      sinkStatus: 'authorized',
    })
    const seam = createFirstReleaseTelemetrySeam({
      consent,
      transport: createThrowingTelemetryTransport(),
    })
    const controller = createNewsletterSubscribeController({
      telemetry: seam,
      fetchImpl: async () =>
        new Response(JSON.stringify({ status: 'accepted' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    await controller.submit()
    assert.equal(controller.getPhase(), 'accepted')
    const emitResult = seam.emitApprovedEvent('curated_promo_discovery_view', {})
    assert.equal(emitResult.ok, false)
    if (!emitResult.ok) assert.equal(emitResult.reason, 'transport_failed')
  })
})

describe('S5-F newsletter requested vs confirmed instrumentation', () => {
  it('requested fires only on accepted; not on click, invalid, or BFF failure', async () => {
    const { seam, transport } = createAuthorizedSeam()
    const controller = createNewsletterSubscribeController({
      telemetry: seam,
      fetchImpl: async () =>
        new Response(JSON.stringify({ status: 'accepted' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    controller.setEmail('bad')
    await controller.submit()
    assert.equal(controller.getPhase(), 'invalid')
    assert.equal(transport.getSent().length, 0)

    controller.resetToIdle()
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    const failing = createNewsletterSubscribeController({
      telemetry: seam,
      fetchImpl: async () =>
        new Response(JSON.stringify({ status: 'unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
    })
    failing.setEmail('visitor@example.com')
    failing.setConsentAccepted(true)
    failing.setAgeConfirmed(true)
    await failing.submit()
    assert.equal(failing.getPhase(), 'unavailable')
    assert.equal(transport.getSent().length, 0)

    await controller.submit()
    assert.equal(controller.getPhase(), 'accepted')
    assert.equal(transport.getSent().length, 1)
    assert.equal(transport.getSent()[0].name, 'newsletter_subscribe_requested')
    assert.deepEqual(transport.getSent()[0].payload, {
      signupSource: 'newsletter_landing',
    })
  })

  it('confirmed fires only on consume success; already_complete is non-emit', async () => {
    const { seam, transport } = createAuthorizedSeam()
    const success = createNewsletterConfirmController({
      telemetry: seam,
      getSearch: () => '?token=abcdefghijklmnopqrstuvwxyz012345',
      replaceUrl: () => {},
      fetchImpl: async (input) => {
        const url = String(input)
        if (url.includes('validate')) {
          return new Response(JSON.stringify({ status: 'ready_to_confirm' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ status: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })
    await success.start()
    await success.confirm()
    assert.equal(success.getPhase(), 'success')
    assert.equal(transport.getSent().length, 1)
    assert.equal(transport.getSent()[0].name, 'newsletter_subscription_confirmed')
    assert.deepEqual(transport.getSent()[0].payload, {})

    transport.clear()
    const already = createNewsletterConfirmController({
      telemetry: seam,
      getSearch: () => '?token=abcdefghijklmnopqrstuvwxyz012345',
      replaceUrl: () => {},
      fetchImpl: async (input) => {
        const url = String(input)
        if (url.includes('validate')) {
          return new Response(JSON.stringify({ status: 'ready_to_confirm' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ status: 'already_complete' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })
    await already.start()
    await already.confirm()
    assert.equal(already.getPhase(), 'already_complete')
    assert.equal(transport.getSent().length, 0)
  })
})

describe('S5-F curated discovery instrumentation', () => {
  it('emits discovery_view once, filter/card/source with bounded payloads', async () => {
    const uninstall = installDom()
    try {
      const { seam, transport } = createAuthorizedSeam()
      const promo = fixturePromos[0]
      assert.ok(promo)

      render(
        createElement(CuratedPromoDiscoveryWidget, {
          promos: fixturePromos,
          telemetry: seam,
        }),
      )

      await waitFor(() => {
        assert.ok(
          transport.getSent().some((e) => e.name === 'curated_promo_discovery_view'),
        )
      })
      assert.equal(
        transport.getSent().filter((e) => e.name === 'curated_promo_discovery_view')
          .length,
        1,
      )

      const brandChip = [...document.querySelectorAll('button')].find((b) =>
        (b.textContent ?? '').includes(promo.brand),
      )
      assert.ok(brandChip)
      fireEvent.click(brandChip)
      const filterEvents = transport
        .getSent()
        .filter((e) => e.name === 'curated_promo_filter_click')
      assert.equal(filterEvents.length, 1)
      assert.equal(
        (filterEvents[0].payload as { filterKey: string }).filterKey,
        'brand',
      )
      assert.equal(
        (filterEvents[0].payload as { filterValue: string }).filterValue,
        promo.brand,
      )

      fireEvent.click(brandChip)
      const clearEvents = transport
        .getSent()
        .filter((e) => e.name === 'curated_promo_filter_click')
      const lastClear = clearEvents.at(-1)
      assert.ok(lastClear)
      assert.equal(
        (lastClear.payload as { action: string; filterValue: string }).action,
        'clear',
      )
      assert.equal(
        (lastClear.payload as { action: string; filterValue: string }).filterValue,
        promo.brand,
      )

      const card = [...document.querySelectorAll('[role="button"]')].find((el) =>
        (el.textContent ?? '').includes(promo.title),
      )
      assert.ok(card)
      fireEvent.click(card)
      assert.ok(
        transport.getSent().some(
          (e) =>
            e.name === 'curated_promo_card_open' &&
            (e.payload as { promoId: string }).promoId === promo.promoId,
        ),
      )

      const source = [...document.querySelectorAll('a')].find((a) =>
        (a.textContent ?? '').includes('View source'),
      )
      if (promo.sourceUrl) {
        assert.ok(source)
        fireEvent.click(source)
        const sourceEvent = transport
          .getSent()
          .find((e) => e.name === 'curated_promo_source_click')
        assert.ok(sourceEvent)
        assert.deepEqual(sourceEvent.payload, { promoId: promo.promoId })
        assert.equal(JSON.stringify(sourceEvent).includes(promo.sourceUrl), false)
      }
    } finally {
      uninstall()
    }
  })

  it('emits published_empty and filter_empty with bounded reason enum', async () => {
    const uninstall = installDom()
    try {
      const { seam, transport } = createAuthorizedSeam()
      render(
        createElement(CuratedPromoDiscoveryWidget, {
          promos: [],
          telemetry: seam,
        }),
      )
      await waitFor(() => {
        assert.ok(
          transport.getSent().some(
            (e) =>
              e.name === 'curated_promo_empty_state_view' &&
              (e.payload as { reason: string }).reason === 'published_empty',
          ),
        )
      })

      transport.clear()
      const { seam: seam2, transport: transport2 } = createAuthorizedSeam()
      render(
        createElement(CuratedPromoDiscoveryWidget, {
          promos: fixturePromos,
          defaultBrand: '__no_such_brand__',
          telemetry: seam2,
        }),
      )
      await waitFor(() => {
        assert.ok(
          transport2.getSent().some(
            (e) =>
              e.name === 'curated_promo_empty_state_view' &&
              (e.payload as { reason: string }).reason === 'filter_empty',
          ),
        )
      })
    } finally {
      uninstall()
    }
  })

  it('source click payload never includes the href URL', () => {
    const uninstall = installDom()
    try {
      const { seam, transport } = createAuthorizedSeam()
      const withSource = fixturePromos.find((p) => p.sourceUrl)
      assert.ok(withSource)
      render(
        createElement(CuratedPromoDetailSheet, {
          promo: withSource,
          onClose: () => {},
          telemetry: seam,
        }),
      )
      const source = document.querySelector('a')
      assert.ok(source)
      fireEvent.click(source)
      const event = transport.getSent()[0]
      assert.equal(event.name, 'curated_promo_source_click')
      assert.deepEqual(event.payload, { promoId: withSource.promoId })
      assert.equal(JSON.stringify(event).includes('http'), false)
    } finally {
      uninstall()
    }
  })
})

describe('S5-F legacy exclusion and runtime audit', () => {
  it('active src runtime lacks legacy tracker/session/log routes by default', () => {
    const needles = [
      'SessionInit',
      '/api/log-session',
      '/api/log-interaction',
      '/api/log-click',
      'useTracker',
      'logEmailSignup',
      'session_logs',
      'interaction_logs',
      'click_logs',
      'SUPABASE_SERVICE_ROLE_KEY',
      '/api/subscribe',
      'email_signups',
      'subscriber_email_hash',
      'reward_access_token',
    ]

    const hits: string[] = []
    function walk(dir: string) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        const st = statSync(full)
        if (st.isDirectory()) {
          if (entry === '__tests__' || entry === '__fixtures__') continue
          walk(full)
          continue
        }
        if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue
        const source = readFileSync(full, 'utf8')
        for (const needle of needles) {
          if (source.includes(needle)) {
            hits.push(`${relative(srcRoot, full)}:${needle}`)
          }
        }
      }
    }
    walk(srcRoot)
    assert.deepEqual(hits, [])
  })

  it('telemetry modules do not introduce DB migrations or service-role access', () => {
    const files = [
      'lib/telemetry/first-release-telemetry-seam.ts',
      'lib/telemetry/first-release-telemetry-transport.ts',
      'lib/telemetry/first-release-telemetry-runtime.ts',
      'lib/telemetry/first-release-telemetry-contract.ts',
    ]
    for (const rel of files) {
      const source = readFileSync(join(srcRoot, rel), 'utf8')
      assert.doesNotMatch(source, /CREATE TABLE|supabase\.from\(|SERVICE_ROLE|googletagmanager|GTM-/i)
      assert.doesNotMatch(source, /\/api\/log-|useTracker|SessionInit/)
    }
  })
})
