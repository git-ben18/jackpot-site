/**
 * S5-D analytics consent enforcement tests (consent gate only).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import ConsentMountSeam from '../../components/shell/ConsentMountSeam'
import SiteFooter from '../../components/shell/SiteFooter'
import SiteHeader from '../../components/shell/SiteHeader'
import { createNewsletterConfirmController } from '../newsletter/newsletter-confirm-controller'
import { createNewsletterSubscribeController } from '../newsletter/newsletter-subscribe-controller'
import {
  ANALYTICS_CONSENT_PERSISTENCE,
  canEmitOptionalAnalytics,
  parseAnalyticsConsentState,
} from '../consent/analytics-consent'
import { createAnalyticsConsentController } from '../consent/analytics-consent-controller'
import { createConsentGatedEmitter } from '../consent/optional-analytics-transport'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

/** Opaque test token — not an S5-E event name or payload schema. */
type TestProbe = { kind: 'probe'; n: number }

describe('S5-D consent vocabulary and persistence freeze', () => {
  it('defaults to unknown and keeps preference persistence blocked', () => {
    const consent = createAnalyticsConsentController()
    assert.equal(consent.getState(), 'unknown')
    assert.equal(consent.getSinkStatus(), 'disabled_by_default')
    assert.equal(consent.canEmitOptionalAnalytics(), false)
    assert.equal(ANALYTICS_CONSENT_PERSISTENCE.status, 'BLOCKED-PENDING-SINK-AUTHORITY')
    assert.equal(ANALYTICS_CONSENT_PERSISTENCE.cookieName, null)
    assert.deepEqual(consent.persistPreference(), {
      ok: false,
      reason: 'persistence_blocked',
    })
  })

  it('maps rejected alias and corrupt stored values fail-closed', () => {
    assert.equal(parseAnalyticsConsentState('rejected'), 'essential_only')
    assert.equal(parseAnalyticsConsentState('not-a-state'), 'essential_only')
    assert.equal(parseAnalyticsConsentState({ email: 'x@y.z' }), 'essential_only')
    const consent = createAnalyticsConsentController()
    assert.equal(consent.hydrateFromUntrustedRaw('garbage'), 'essential_only')
    assert.equal(consent.canEmitOptionalAnalytics(), false)
  })
})

describe('S5-D optional analytics gate', () => {
  it('unknown and essential_only emit zero optional transport calls', () => {
    for (const initial of ['unknown', 'essential_only'] as const) {
      const consent = createAnalyticsConsentController({
        initialState: initial,
        sinkStatus: 'authorized',
      })
      const emitter = createConsentGatedEmitter<TestProbe>(consent)
      const result = emitter.emit({ kind: 'probe', n: 1 })
      assert.equal(result.emitted, false)
      assert.equal(emitter.getEmitted().length, 0)
    }
  })

  it('analytics_accepted permits the seam only when sink is authorized', () => {
    const disabled = createAnalyticsConsentController({
      initialState: 'analytics_accepted',
      sinkStatus: 'disabled_by_default',
    })
    const disabledEmitter = createConsentGatedEmitter<TestProbe>(disabled)
    assert.equal(disabled.isOptionalConsentGranted(), true)
    assert.equal(disabled.canEmitOptionalAnalytics(), false)
    assert.equal(disabledEmitter.emit({ kind: 'probe', n: 1 }).emitted, false)

    const authorized = createAnalyticsConsentController({
      initialState: 'analytics_accepted',
      sinkStatus: 'authorized',
    })
    const emitter = createConsentGatedEmitter<TestProbe>(authorized)
    assert.equal(authorized.canEmitOptionalAnalytics(), true)
    assert.equal(emitter.emit({ kind: 'probe', n: 2 }).emitted, true)
    assert.deepEqual(emitter.getEmitted(), [{ kind: 'probe', n: 2 }])
  })

  it('revoke stops subsequent optional emissions', () => {
    const consent = createAnalyticsConsentController({
      initialState: 'analytics_accepted',
      sinkStatus: 'authorized',
    })
    const emitter = createConsentGatedEmitter<TestProbe>(consent)
    assert.equal(emitter.emit({ kind: 'probe', n: 1 }).emitted, true)
    consent.revokeAnalytics()
    assert.equal(consent.getState(), 'essential_only')
    assert.equal(emitter.emit({ kind: 'probe', n: 2 }).emitted, false)
    assert.equal(emitter.getEmitted().length, 1)
  })

  it('does not emit before consent is resolved from the default unknown state', () => {
    const consent = createAnalyticsConsentController()
    const emitter = createConsentGatedEmitter<TestProbe>(consent)
    assert.equal(consent.getState(), 'unknown')
    assert.equal(canEmitOptionalAnalytics('unknown', 'authorized'), false)
    assert.equal(emitter.emit({ kind: 'probe', n: 0 }).emitted, false)
  })
})

describe('S5-D product UX remains usable when analytics rejected', () => {
  it('newsletter subscribe controller still accepts when analytics essential_only', async () => {
    const consent = createAnalyticsConsentController({
      initialState: 'essential_only',
    })
    assert.equal(consent.canEmitOptionalAnalytics(), false)

    let calls = 0
    const controller = createNewsletterSubscribeController({
      fetchImpl: async () => {
        calls += 1
        return new Response(JSON.stringify({ status: 'accepted' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
      isAcquisitionEnabled: () => true,
    })
    controller.setEmail('visitor@example.com')
    controller.setConsentAccepted(true)
    controller.setAgeConfirmed(true)
    await controller.submit()
    assert.equal(controller.getPhase(), 'accepted')
    assert.equal(calls, 1)
  })

  it('confirmation controller still validates when analytics essential_only', async () => {
    const consent = createAnalyticsConsentController({
      initialState: 'essential_only',
      sinkStatus: 'authorized',
    })
    assert.equal(consent.canEmitOptionalAnalytics(), false)

    const controller = createNewsletterConfirmController({
      fetchImpl: async (url) => {
        const path = String(url)
        if (path.includes('validate')) {
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
      getSearch: () => '?token=abcdefghijklmnopqrstuvwxyz012345',
      replaceUrl: () => {},
    })
    await controller.start()
    assert.equal(controller.getPhase(), 'ready_to_confirm')
  })

  it('curated discovery modules do not gate rendering on analytics consent', () => {
    const landing = readFileSync(
      join(srcRoot, 'components/v2/curated-promos/CuratedPromoLandingSection.tsx'),
      'utf8',
    )
    const widget = readFileSync(
      join(srcRoot, 'components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx'),
      'utf8',
    )
    assert.doesNotMatch(landing, /analytics-consent|canEmitOptionalAnalytics/)
    assert.doesNotMatch(widget, /analytics-consent|canEmitOptionalAnalytics/)
  })
})

describe('S5-D UI / privacy / boundary', () => {
  it('keeps consent mount empty (no decorative banner) and Privacy linked in shell', () => {
    const mount = renderToStaticMarkup(createElement(ConsentMountSeam))
    const header = renderToStaticMarkup(createElement(SiteHeader))
    const footer = renderToStaticMarkup(createElement(SiteFooter))
    assert.match(mount, /data-consent-ui="none"/)
    assert.doesNotMatch(mount, /Accept|Reject|cookie banner/i)
    assert.match(header, /href="\/privacy"/)
    assert.match(footer, /href="\/privacy"/)
  })

  it('consent modules do not write cookies or queue pre-consent replay storage', () => {
    const files = [
      'lib/consent/analytics-consent.ts',
      'lib/consent/analytics-consent-controller.ts',
      'lib/consent/optional-analytics-transport.ts',
      'components/shell/ConsentMountSeam.tsx',
    ]
    for (const rel of files) {
      const source = readFileSync(join(srcRoot, rel), 'utf8')
      assert.doesNotMatch(source, /document\.cookie|localStorage|sessionStorage/)
      assert.doesNotMatch(source, /preConsentQueue|replayQueue/)
    }
    assert.deepEqual(
      [...ANALYTICS_CONSENT_PERSISTENCE.excludedLegacyKeys],
      ['cookie_consent', 'email_signup', 'subscriber_email_hash', 'session_id'],
    )
  })

  it('does not define event taxonomy, payload schemas, or provider/DB objects', () => {
    const gateSource = readFileSync(
      join(srcRoot, 'lib/consent/optional-analytics-transport.ts'),
      'utf8',
    )
    assert.match(gateSource, /createConsentGatedEmitter/)
    assert.doesNotMatch(gateSource, /Record<string,\s*unknown>/)
    assert.doesNotMatch(gateSource, /\bPROHIBITED_|\bALLOWLIST_/)
    assert.doesNotMatch(gateSource, /curated_promo_|newsletter_subscribe/)
    assert.doesNotMatch(gateSource, /CREATE TABLE|supabase\.from\(|googletagmanager|GTM-/i)

    for (const name of ['analytics-consent.ts', 'analytics-consent-controller.ts']) {
      const source = readFileSync(join(srcRoot, 'lib/consent', name), 'utf8')
      assert.doesNotMatch(source, /CREATE TABLE|supabase\.from\(|googletagmanager|GTM-/i)
    }
  })
})
