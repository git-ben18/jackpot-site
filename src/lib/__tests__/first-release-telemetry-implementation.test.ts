/**
 * S5-F telemetry implementation guardrails.
 * Consent gate + closed payloads + fail-soft product paths + legacy exclusion.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { JSDOM } from 'jsdom'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'

import { createAnalyticsConsentController } from '../consent/analytics-consent-controller'
import type { AnalyticsConsentState } from '../consent/analytics-consent'
import type { AnalyticsSinkStatus } from '../consent/analytics-consent'
import { createNewsletterConfirmController } from '../newsletter/newsletter-confirm-controller'
import { createNewsletterSubscribeController } from '../newsletter/newsletter-subscribe-controller'
import { EMPTY_CURATED_PROMO_FILTERS } from '../../types/curatedPromos'
import { mapFixtureCuratedPromos } from '../__fixtures__/curatedPromoDiscoveryDto.fixtures'
import CuratedPromoDetailSheet from '../../components/v2/curated-promos/CuratedPromoDetailSheet'
import CuratedPromoDiscoveryWidget from '../../components/v2/curated-promos/CuratedPromoDiscoveryWidget'
import { CuratedPromoLandingSectionView } from '../../components/v2/curated-promos/CuratedPromoLandingSectionView'
import {
  createFirstReleaseTelemetryEmitter,
  emitUntrustedFirstReleaseTelemetry,
  getDefaultFirstReleaseTelemetry,
  type FirstReleaseTelemetryEmitter,
} from '../telemetry/first-release-telemetry-emitter'
import {
  createDisabledTelemetryTransport,
  createFakeTelemetryTransport,
  createNoopTelemetryTransport,
  type CreateFakeTelemetryTransportOptions,
} from '../telemetry/first-release-telemetry-transport'
import {
  createOnceAttemptTracker,
  filterClickPayloadFromToggle,
} from '../telemetry/first-release-telemetry-triggers'
import type {
  FirstReleaseTelemetryEnvelope,
  TelemetryFilterOptionVocabulary,
} from '../telemetry/first-release-telemetry-contract'
import { TELEMETRY_SCHEMA_VERSION } from '../telemetry/first-release-telemetry-contract'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const fixturePromos = mapFixtureCuratedPromos()
const fixturePromo = fixturePromos[0]
const CONFIRM_TOKEN = 'abcdefghijklmnopqrstuvwxyz012345'

const SAMPLE_VOCABULARY: TelemetryFilterOptionVocabulary = {
  brands: ['Hard Rock', 'Venetian', 'Aria'],
  marketSlugs: ['las-vegas'],
  signalCategories: ['loyalty_rewards', 'dining_food'],
  signalTypesForCategory: ['match_play', 'bonus_spin'],
}

/**
 * Compile-only public-API contract. `tsc` fails if emitApprovedEvent widens
 * back to arbitrary string names or unknown payloads.
 */
export function assertFirstReleaseTelemetryEmitApi(
  emitter: FirstReleaseTelemetryEmitter,
  vocabulary: TelemetryFilterOptionVocabulary,
): void {
  emitter.emitApprovedEvent('curated_promo_discovery_view', {})
  emitter.emitApprovedEvent('curated_promo_card_open', { promoId: 'mock-promo-1' })
  emitter.emitApprovedEvent(
    'curated_promo_filter_click',
    { filterKey: 'brand', action: 'apply', filterValue: 'Venetian' },
    { filterVocabulary: vocabulary },
  )
  // @ts-expect-error unknown event names are not part of the public API
  emitter.emitApprovedEvent('session_init', {})
  emitter.emitApprovedEvent('curated_promo_card_open', {
    promoId: 'mock-promo-1',
    // @ts-expect-error extra payload fields are not part of the public API
    email: 'visitor@example.com',
  })
  // @ts-expect-error filter clicks require the rendered vocabulary
  emitter.emitApprovedEvent('curated_promo_filter_click', {
    filterKey: 'brand',
    action: 'apply',
    filterValue: 'Venetian',
  })
}

function correlatedEnvelopePayload(
  envelope: FirstReleaseTelemetryEnvelope,
): string {
  if (envelope.name === 'curated_promo_filter_click') {
    return envelope.payload.filterValue
  }
  if (envelope.name === 'curated_promo_card_open') {
    return envelope.payload.promoId
  }
  if (envelope.name === 'curated_promo_discovery_view') {
    // @ts-expect-error discovery payload is empty, not a promoId payload
    const wrong: { promoId: string } = envelope.payload
    return wrong.promoId
  }
  return envelope.name
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createHarness({
  consentState = 'analytics_accepted',
  sinkStatus = 'authorized',
  ...transportOptions
}: {
  consentState?: AnalyticsConsentState
  sinkStatus?: AnalyticsSinkStatus
} & CreateFakeTelemetryTransportOptions = {}) {
  const consent = createAnalyticsConsentController({
    initialState: consentState,
    sinkStatus,
  })
  const transport = createFakeTelemetryTransport(transportOptions)
  const emitter = createFirstReleaseTelemetryEmitter({ consent, transport })
  return { consent, transport, emitter }
}

function envelopeDump(transport: { sent: unknown[] }): string {
  return JSON.stringify(transport.sent)
}

async function submitAccepted(
  telemetry: FirstReleaseTelemetryEmitter,
): Promise<ReturnType<typeof createNewsletterSubscribeController>> {
  const controller = createNewsletterSubscribeController({
    telemetry,
    fetchImpl: async () => jsonResponse(200, { status: 'accepted' }),
  })
  controller.setEmail('visitor@example.com')
  controller.setConsentAccepted(true)
  controller.setAgeConfirmed(true)
  await controller.submit()
  return controller
}

type DomHarness = { cleanup: () => void }

function installDom(): DomHarness {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
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

describe('S5-F consent and sink gate', () => {
  it('unknown and rejected consent produce zero transport calls', () => {
    for (const consentState of ['unknown', 'essential_only'] as const) {
      const { transport, emitter } = createHarness({
        consentState,
        sinkStatus: 'authorized',
      })
      const result = emitter.emitApprovedEvent('curated_promo_discovery_view', {})
      assert.equal(result.emitted, false)
      assert.equal(transport.sendCount, 0)
      assert.deepEqual(transport.sent, [])
    }
  })

  it('accepted with authorized sink forwards only the S5-E event and payload', () => {
    const { transport, emitter } = createHarness()
    const result = emitter.emitApprovedEvent('curated_promo_discovery_view', {})
    assert.equal(result.emitted, true)
    assert.equal(transport.sent.length, 1)
    assert.deepEqual(transport.sent[0], {
      name: 'curated_promo_discovery_view',
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      payload: {},
    })
  })

  it('accepted still suppresses when the production sink is disabled', () => {
    const { transport, emitter } = createHarness({
      consentState: 'analytics_accepted',
      sinkStatus: 'disabled_by_default',
    })
    emitter.emitApprovedEvent('curated_promo_discovery_view', {})
    assert.equal(transport.sendCount, 0)
  })

  it('revocation suppresses later optional events', () => {
    const { consent, transport, emitter } = createHarness()
    emitter.emitApprovedEvent('curated_promo_discovery_view', {})
    assert.equal(transport.sent.length, 1)
    consent.revokeAnalytics()
    emitter.emitApprovedEvent('curated_promo_card_open', {
      promoId: 'mock-promo-venetian-freeplay',
    })
    assert.equal(transport.sent.length, 1)
    consent.acceptAnalytics()
    emitter.emitApprovedEvent('curated_promo_card_open', {
      promoId: 'mock-promo-venetian-freeplay',
    })
    assert.equal(transport.sent.length, 2)
  })

  it('does not process-dedupe: the same emitter may emit discovery more than once', () => {
    const { transport, emitter } = createHarness()
    emitter.emitApprovedEvent('curated_promo_discovery_view', {})
    emitter.emitApprovedEvent('curated_promo_discovery_view', {})
    assert.equal(transport.sent.length, 2)
  })
})

describe('S5-F payload allowlist', () => {
  it('rejects unknown event names without calling transport', () => {
    const harness = createHarness()
    const result = emitUntrustedFirstReleaseTelemetry(
      harness,
      'session_init',
      {},
    )
    assert.equal(result.emitted, false)
    if (result.emitted === false && result.ok === false) {
      assert.equal(result.reason, 'unknown_event')
    }
    assert.equal(harness.transport.sendCount, 0)
  })

  it('rejects extra payload fields and does not forward them', () => {
    const harness = createHarness()
    const result = emitUntrustedFirstReleaseTelemetry(harness, 'curated_promo_card_open', {
      promoId: 'mock-promo-venetian-freeplay',
      email: 'visitor@example.com',
      metadata: { extra: true },
    })
    assert.equal(result.emitted, false)
    if (result.emitted === false && result.ok === false) {
      assert.equal(result.reason, 'invalid_payload')
    }
    assert.deepEqual(harness.transport.sent, [])
  })

  it('rejects filter clicks whose filterValue is not in the rendered vocabulary', () => {
    const harness = createHarness()
    harness.emitter.emitApprovedEvent(
      'curated_promo_filter_click',
      {
        filterKey: 'brand',
        action: 'apply',
        filterValue: 'visitor@example.com',
      },
      { filterVocabulary: SAMPLE_VOCABULARY },
    )
    emitUntrustedFirstReleaseTelemetry(
      harness,
      'curated_promo_filter_click',
      {
        filterKey: 'brand',
        action: 'apply',
        filterValue: 'Hard Rock',
        sourceUrl: 'https://example.com/promo?token=abc',
      },
      { filterVocabulary: SAMPLE_VOCABULARY },
    )
    assert.deepEqual(harness.transport.sent, [])
  })

  it('accepts a vocabulary-bound filter click including multi-word brand and clear', () => {
    const { transport, emitter } = createHarness()
    const apply = emitter.emitApprovedEvent(
      'curated_promo_filter_click',
      { filterKey: 'brand', action: 'apply', filterValue: 'Hard Rock' },
      { filterVocabulary: SAMPLE_VOCABULARY },
    )
    const clear = emitter.emitApprovedEvent(
      'curated_promo_filter_click',
      { filterKey: 'brand', action: 'clear', filterValue: 'Hard Rock' },
      { filterVocabulary: SAMPLE_VOCABULARY },
    )
    assert.equal(apply.emitted, true)
    assert.equal(clear.emitted, true)
    assert.deepEqual(transport.sent[0]?.payload, {
      filterKey: 'brand',
      action: 'apply',
      filterValue: 'Hard Rock',
    })
    assert.deepEqual(transport.sent[1]?.payload, {
      filterKey: 'brand',
      action: 'clear',
      filterValue: 'Hard Rock',
    })
  })

  it('keeps email, hash, token, full URL, and referrer out of forwarded envelopes', () => {
    const { transport, emitter } = createHarness()
    emitter.emitApprovedEvent('newsletter_subscribe_requested', {
      signupSource: 'newsletter_landing',
    })
    emitter.emitApprovedEvent('curated_promo_card_open', {
      promoId: fixturePromo.promoId,
    })
    emitter.emitApprovedEvent('curated_promo_source_click', {
      promoId: fixturePromo.promoId,
    })
    const dump = envelopeDump(transport)
    assert.equal(dump.includes('visitor@example.com'), false)
    assert.equal(dump.includes(CONFIRM_TOKEN), false)
    assert.equal(dump.includes('example.com'), false)
    assert.equal(dump.includes('referrer'), false)
    assert.equal(dump.includes('sourceUrl'), false)
    assert.equal(dump.includes('email'), false)
    assert.equal(dump.includes('token'), false)
    assert.match(dump, /newsletter_landing/)
    assert.match(dump, /mock-promo-venetian-freeplay/)
  })
})

describe('S5-F newsletter triggers', () => {
  it('emits requested only after browser accepted, not on validation or BFF failure', async () => {
    const { transport, emitter } = createHarness()
    const invalid = createNewsletterSubscribeController({ telemetry: emitter })
    await invalid.submit()
    assert.equal(invalid.getPhase(), 'invalid')
    assert.equal(transport.sent.length, 0)

    const unavailable = createNewsletterSubscribeController({
      telemetry: emitter,
      fetchImpl: async () => jsonResponse(503, { status: 'unavailable' }),
    })
    unavailable.setEmail('visitor@example.com')
    unavailable.setConsentAccepted(true)
    unavailable.setAgeConfirmed(true)
    await unavailable.submit()
    assert.equal(unavailable.getPhase(), 'unavailable')
    assert.equal(transport.sent.length, 0)

    const accepted = await submitAccepted(emitter)
    assert.equal(accepted.getPhase(), 'accepted')
    assert.equal(transport.sent.length, 1)
    assert.deepEqual(transport.sent[0], {
      name: 'newsletter_subscribe_requested',
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      payload: { signupSource: 'newsletter_landing' },
    })
  })

  it('does not treat website_footer as a v1 requested payload', async () => {
    const { transport, emitter } = createHarness()
    const controller = createNewsletterSubscribeController({
      telemetry: emitter,
      signupSource: 'website_footer',
      fetchImpl: async () => jsonResponse(200, { status: 'accepted' }),
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    await controller.submit()
    assert.equal(controller.getPhase(), 'accepted')
    assert.equal(transport.sent.length, 0)
  })

  it('emits confirmed only on consume success, never already_complete or validate-ready', async () => {
    const { transport, emitter } = createHarness()
    const ready = createNewsletterConfirmController({
      telemetry: emitter,
      getSearch: () => `?token=${CONFIRM_TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async () => jsonResponse(200, { status: 'ready_to_confirm' }),
    })
    await ready.start()
    assert.equal(ready.getPhase(), 'ready_to_confirm')
    assert.equal(transport.sent.length, 0)
    ready.dispose()

    const already = createNewsletterConfirmController({
      telemetry: emitter,
      getSearch: () => `?token=${CONFIRM_TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async (url) => {
        if (String(url).includes('validate')) {
          return jsonResponse(200, { status: 'ready_to_confirm' })
        }
        return jsonResponse(200, { status: 'already_complete' })
      },
    })
    await already.start()
    await already.confirm()
    assert.equal(already.getPhase(), 'already_complete')
    assert.equal(transport.sent.length, 0)
    already.dispose()

    const success = createNewsletterConfirmController({
      telemetry: emitter,
      getSearch: () => `?token=${CONFIRM_TOKEN}`,
      replaceUrl: () => {},
      fetchImpl: async (url) => {
        if (String(url).includes('validate')) {
          return jsonResponse(200, { status: 'ready_to_confirm' })
        }
        return jsonResponse(200, { status: 'success' })
      },
    })
    await success.start()
    await success.confirm()
    assert.equal(success.getPhase(), 'success')
    assert.equal(transport.sent.length, 1)
    assert.deepEqual(transport.sent[0], {
      name: 'newsletter_subscription_confirmed',
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      payload: {},
    })
    const dump = envelopeDump(transport)
    assert.equal(dump.includes(CONFIRM_TOKEN), false)
    success.dispose()
  })
})

describe('S5-F curated triggers', () => {
  it('emits only the clicked filter key when category also clears signalType', () => {
    const payload = filterClickPayloadFromToggle(
      {
        ...EMPTY_CURATED_PROMO_FILTERS,
        signalCategory: 'loyalty_rewards',
        signalType: 'match_play',
      },
      {
        ...EMPTY_CURATED_PROMO_FILTERS,
        signalCategory: null,
        signalType: null,
      },
    )
    assert.deepEqual(payload, {
      filterKey: 'signalCategory',
      action: 'clear',
      filterValue: 'loyalty_rewards',
    })
  })

  it('fires discovery view once, filter click, card open, and empty-state reasons', async () => {
    activeDom = installDom()
    const { transport, emitter } = createHarness()
    const view = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.equal(
        transport.sent.some((e) => e.name === 'curated_promo_discovery_view'),
        true,
      )
    })
    fireEvent.click(view.getByRole('button', { name: /^Venetian$/ }))
    await waitFor(() => {
      assert.equal(
        transport.sent.some(
          (e) =>
            e.name === 'curated_promo_filter_click' &&
            'filterKey' in e.payload &&
            e.payload.filterKey === 'brand' &&
            e.payload.filterValue === 'Venetian',
        ),
        true,
      )
    })
    fireEvent.click(view.getByText('Spring free play bundle'))
    await waitFor(() => {
      assert.equal(
        transport.sent.some(
          (e) =>
            e.name === 'curated_promo_card_open' &&
            'promoId' in e.payload &&
            e.payload.promoId === 'mock-promo-venetian-freeplay',
        ),
        true,
      )
    })
    view.unmount()

    const empty = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: [],
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.equal(
        transport.sent.some(
          (e) =>
            e.name === 'curated_promo_empty_state_view' &&
            'reason' in e.payload &&
            e.payload.reason === 'published_empty',
        ),
        true,
      )
    })
    empty.unmount()

    const filtered = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        defaultBrand: 'Hard Rock',
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.equal(
        transport.sent.some(
          (e) =>
            e.name === 'curated_promo_empty_state_view' &&
            'reason' in e.payload &&
            e.payload.reason === 'filter_empty',
        ),
        true,
      )
    })
    filtered.unmount()

    const discoveryViews = transport.sent.filter(
      (e) => e.name === 'curated_promo_discovery_view',
    )
    // First widget + later non-empty widget instance (filter_empty) share an
    // emitter but not a lifetime, so discovery may emit again.
    assert.equal(discoveryViews.length, 2)
    const dump = envelopeDump(transport)
    assert.equal(dump.includes('https://'), false)
    assert.equal(dump.includes(fixturePromo.sourceUrl ?? 'no-url'), false)
  })

  it('emits fail_soft from the landing empty state without changing the visitor copy', async () => {
    activeDom = installDom()
    const { transport, emitter } = createHarness()
    const view = render(
      createElement(CuratedPromoLandingSectionView, {
        result: {
          ok: false,
          reason: 'query_failed',
          message: 'Curated promo discovery is temporarily unavailable.',
          promos: [],
        },
        telemetry: emitter,
      }),
    )
    assert.match(view.container.textContent ?? '', /temporarily unavailable/i)
    await waitFor(() => {
      assert.deepEqual(transport.sent, [
        {
          name: 'curated_promo_empty_state_view',
          schemaVersion: TELEMETRY_SCHEMA_VERSION,
          payload: { reason: 'fail_soft' },
        },
      ])
    })
    view.unmount()
  })

  it('emits source click with promoId only and does not block the outbound href', () => {
    activeDom = installDom()
    const { transport, emitter } = createHarness()
    const view = render(
      createElement(CuratedPromoDetailSheet, {
        promo: fixturePromo,
        onClose: () => {},
        telemetry: emitter,
      }),
    )
    const link = view.getByRole('link', { name: 'View source' })
    assert.equal(link.getAttribute('href'), fixturePromo.sourceUrl)
    fireEvent.click(link)
    assert.equal(transport.sent.length, 1)
    assert.deepEqual(transport.sent[0], {
      name: 'curated_promo_source_click',
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      payload: { promoId: fixturePromo.promoId },
    })
    assert.equal(envelopeDump(transport).includes('https://'), false)
    view.unmount()
  })
})

describe('S5-F once/dedupe lifetime owners', () => {
  it('marks an attempt immediately so later accept cannot replay', () => {
    const tracker = createOnceAttemptTracker()
    assert.equal(tracker.attempt('curated_promo_discovery_view'), true)
    assert.equal(tracker.attempt('curated_promo_discovery_view'), false)
  })

  it('one widget instance emits discovery at most once', async () => {
    activeDom = installDom()
    const { transport, emitter } = createHarness()
    const view = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.equal(
        transport.sent.filter((e) => e.name === 'curated_promo_discovery_view').length,
        1,
      )
    })
    fireEvent.click(view.getByRole('button', { name: /^Venetian$/ }))
    await waitFor(() => {
      assert.equal(
        transport.sent.some((e) => e.name === 'curated_promo_filter_click'),
        true,
      )
    })
    assert.equal(
      transport.sent.filter((e) => e.name === 'curated_promo_discovery_view').length,
      1,
    )
    view.unmount()
  })

  it('a new widget instance using the same emitter may emit discovery again', async () => {
    activeDom = installDom()
    const { transport, emitter } = createHarness()
    const first = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.equal(
        transport.sent.filter((e) => e.name === 'curated_promo_discovery_view').length,
        1,
      )
    })
    first.unmount()
    const second = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.equal(
        transport.sent.filter((e) => e.name === 'curated_promo_discovery_view').length,
        2,
      )
    })
    second.unmount()
  })

  it('pre-consent widget mount does not replay discovery after later acceptance', async () => {
    activeDom = installDom()
    const { consent, transport, emitter } = createHarness({
      consentState: 'unknown',
      sinkStatus: 'authorized',
    })
    const view = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: emitter,
      }),
    )
    await waitFor(() => {
      assert.match(view.container.textContent ?? '', /Curated promos/)
    })
    assert.equal(transport.sent.length, 0)
    consent.acceptAnalytics()
    const replayEmitter = createFirstReleaseTelemetryEmitter({
      consent,
      transport,
    })
    view.rerender(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: replayEmitter,
      }),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert.equal(
      transport.sent.filter((e) => e.name === 'curated_promo_discovery_view').length,
      0,
    )
    view.unmount()
  })

  it('separate successful confirmation-controller lifetimes are independent', async () => {
    const { transport, emitter } = createHarness()
    async function confirmOnce() {
      const controller = createNewsletterConfirmController({
        telemetry: emitter,
        getSearch: () => `?token=${CONFIRM_TOKEN}`,
        replaceUrl: () => {},
        fetchImpl: async (url) => {
          if (String(url).includes('validate')) {
            return jsonResponse(200, { status: 'ready_to_confirm' })
          }
          return jsonResponse(200, { status: 'success' })
        },
      })
      await controller.start()
      await controller.confirm()
      assert.equal(controller.getPhase(), 'success')
      controller.dispose()
    }
    await confirmOnce()
    await confirmOnce()
    assert.equal(
      transport.sent.filter((e) => e.name === 'newsletter_subscription_confirmed')
        .length,
      2,
    )
  })

  it('keeps the public emit API typed to correlated S5-E envelopes', () => {
    assert.equal(typeof assertFirstReleaseTelemetryEmitApi, 'function')
    assert.equal(typeof correlatedEnvelopePayload, 'function')
    const envelope: FirstReleaseTelemetryEnvelope = {
      name: 'curated_promo_filter_click',
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      payload: {
        filterKey: 'brand',
        action: 'apply',
        filterValue: 'Venetian',
      },
    }
    assert.equal(correlatedEnvelopePayload(envelope), 'Venetian')
  })
})

describe('S5-F fail-soft product paths', () => {
  it('transport throw never changes subscribe accepted outcome', async () => {
    const { emitter } = createHarness({ throwOnSend: true })
    const controller = await submitAccepted(emitter)
    assert.equal(controller.getPhase(), 'accepted')
  })

  it('transport reject and hang never change confirm success outcome', async () => {
    const rejecting = createHarness({ rejectOnSend: true })
    const hang = createHarness({ hangOnSend: true })
    for (const { emitter } of [rejecting, hang]) {
      const controller = createNewsletterConfirmController({
        telemetry: emitter,
        getSearch: () => `?token=${CONFIRM_TOKEN}`,
        replaceUrl: () => {},
        fetchImpl: async (url) => {
          if (String(url).includes('validate')) {
            return jsonResponse(200, { status: 'ready_to_confirm' })
          }
          return jsonResponse(200, { status: 'success' })
        },
      })
      await controller.start()
      await controller.confirm()
      assert.equal(controller.getPhase(), 'success')
      controller.dispose()
    }
  })

  it('invalid event or payload never changes curated card-open UX', () => {
    activeDom = installDom()
    const throwing = createFakeTelemetryTransport({ throwOnSend: true })
    const consent = createAnalyticsConsentController({
      initialState: 'analytics_accepted',
      sinkStatus: 'authorized',
    })
    const emitter = createFirstReleaseTelemetryEmitter({
      consent,
      transport: throwing,
    })
    const opened: string[] = []
    const view = render(
      createElement(CuratedPromoDiscoveryWidget, {
        promos: fixturePromos,
        telemetry: emitter,
      }),
    )
    fireEvent.click(view.getByText('Spring free play bundle'))
    opened.push('opened')
    assert.equal(view.getByRole('dialog').textContent?.includes('Spring free play bundle'), true)
    assert.deepEqual(opened, ['opened'])
    view.unmount()
  })
})

describe('S5-F explicit sink and legacy exclusion', () => {
  it('keeps the default production sink explicit disabled / no-op / fake kinds', () => {
    assert.equal(createDisabledTelemetryTransport().kind, 'disabled')
    assert.equal(createNoopTelemetryTransport().kind, 'noop')
    assert.equal(createFakeTelemetryTransport().kind, 'fake')
    assert.equal(getDefaultFirstReleaseTelemetry().getTransportKind(), 'disabled')
    const result = getDefaultFirstReleaseTelemetry().emitApprovedEvent(
      'curated_promo_discovery_view',
      {},
    )
    assert.equal(result.emitted, false)
  })

  it('records absence of legacy tracker and session routes in active src/', () => {
    const patterns = [
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
      ['subscriber', 'email', 'hash'].join('_'),
      'reward_access_token',
    ] as const

    const hits: Record<string, string[]> = Object.fromEntries(
      patterns.map((p) => [p, [] as string[]]),
    )

    for (const file of walkFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8')
      const rel = relative(srcRoot, file).replace(/\\/g, '/')
      if (rel.includes('__tests__/') || rel.includes('__fixtures__/')) continue
      for (const pattern of patterns) {
        if (!source.includes(pattern)) continue
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

  it('does not let curated widgets import the consent gate directly', () => {
    const widget = readFileSync(
      join(srcRoot, 'components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx'),
      'utf8',
    )
    const landing = readFileSync(
      join(srcRoot, 'components/v2/curated-promos/CuratedPromoLandingSection.tsx'),
      'utf8',
    )
    assert.doesNotMatch(widget, /analytics-consent|canEmitOptionalAnalytics/)
    assert.doesNotMatch(landing, /analytics-consent|canEmitOptionalAnalytics/)
  })
})
