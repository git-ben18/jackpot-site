/**
 * S5-E contract static assertions — meaning + closed payload schemas only.
 * No provider/network.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  FIRST_RELEASE_TELEMETRY_CONTRACT,
  FIRST_RELEASE_TELEMETRY_EVENT_NAMES,
  NEWSLETTER_CONFIRM_EMIT_STATUS,
  NEWSLETTER_CONFIRM_NON_EMIT_STATUSES,
  NEWSLETTER_SUBSCRIBE_NON_EMIT_STATUSES,
  TELEMETRY_CONSENT_CLASS,
  TELEMETRY_EMPTY_STATE_REASONS,
  TELEMETRY_FILTER_ACTIONS,
  TELEMETRY_FILTER_KEYS,
  TELEMETRY_PROHIBITED_PAYLOAD_KEYS,
  TELEMETRY_SCHEMA_VERSION,
  TELEMETRY_SESSION_IDENTITY,
  TELEMETRY_SIGNAL_CATEGORIES,
  TELEMETRY_SIGNUP_SOURCES_V1,
  TELEMETRY_SINK_STATUS,
  type CuratedPromoFilterClickPayload,
  type FirstReleaseTelemetryPayloadByEvent,
  type TelemetryFilterOptionVocabulary,
  isAllowedPayloadKey,
  isFirstReleaseTelemetryEventName,
  isProhibitedPayloadKey,
  isTelemetryEmptyPayload,
  isTelemetryEmptyStateReason,
  isTelemetrySignupSourceV1,
  isValidCuratedPromoEmptyStateViewPayload,
  isValidCuratedPromoFilterClickPayload,
  isValidFilterValueForKey,
  isValidNewsletterSubscribeRequestedPayload,
  isValidPromoId,
  isValidPromoIdPayload,
  shouldEmitNewsletterSubscribeRequested,
  shouldEmitNewsletterSubscriptionConfirmed,
} from '../telemetry/first-release-telemetry-contract'

const SAMPLE_FILTER_VOCABULARY: TelemetryFilterOptionVocabulary = {
  brands: ['Hard Rock', 'Resorts World', 'MGM'],
  marketSlugs: ['las-vegas', 'atlantic-city'],
  signalCategories: ['room_discount', 'dining_food', 'event_package'],
  signalTypesForCategory: ['room_rate_percent_off', 'package_option'],
}

describe('S5-E first-release telemetry contract', () => {
  it('freezes a closed event-name allowlist of exactly seven names', () => {
    assert.equal(FIRST_RELEASE_TELEMETRY_EVENT_NAMES.length, 7)
    assert.deepEqual([...FIRST_RELEASE_TELEMETRY_EVENT_NAMES], [
      'curated_promo_discovery_view',
      'curated_promo_filter_click',
      'curated_promo_card_open',
      'curated_promo_empty_state_view',
      'curated_promo_source_click',
      'newsletter_subscribe_requested',
      'newsletter_subscription_confirmed',
    ])
    assert.equal(isFirstReleaseTelemetryEventName('curated_promo_discovery_view'), true)
    assert.equal(isFirstReleaseTelemetryEventName('session_logs'), false)
    assert.equal(isFirstReleaseTelemetryEventName('click_logs'), false)
    assert.equal(isFirstReleaseTelemetryEventName('newsletter_subscribe_clicked'), false)
  })

  it('encodes closed event→payload schemas, not only key lists', () => {
    for (const name of FIRST_RELEASE_TELEMETRY_EVENT_NAMES) {
      const contract = FIRST_RELEASE_TELEMETRY_CONTRACT[name]
      assert.equal(contract.schemaVersion, TELEMETRY_SCHEMA_VERSION)
      assert.equal(contract.consentClass, TELEMETRY_CONSENT_CLASS)
      assert.equal(contract.sinkStatus, TELEMETRY_SINK_STATUS)
      assert.equal(contract.sessionIdentity, TELEMETRY_SESSION_IDENTITY)
      assert.equal(contract.failureBehavior, 'swallow_nonblocking')
      for (const key of contract.allowedPayloadKeys) {
        assert.equal(isProhibitedPayloadKey(key), false, `${name}.${key}`)
      }
    }

    const zeroKeyEvents = [
      'curated_promo_discovery_view',
      'newsletter_subscription_confirmed',
    ] as const
    for (const name of zeroKeyEvents) {
      assert.deepEqual(FIRST_RELEASE_TELEMETRY_CONTRACT[name].allowedPayloadKeys, [])
      const empty: FirstReleaseTelemetryPayloadByEvent[typeof name] = {}
      assert.equal(isTelemetryEmptyPayload(empty), true)
    }
    assert.equal(isTelemetryEmptyPayload({ reason: 'fail_soft' }), false)

    assert.deepEqual(
      [...FIRST_RELEASE_TELEMETRY_CONTRACT.curated_promo_filter_click.allowedPayloadKeys],
      ['filterKey', 'action', 'filterValue'],
    )
    assert.deepEqual(
      [...FIRST_RELEASE_TELEMETRY_CONTRACT.curated_promo_empty_state_view.allowedPayloadKeys],
      ['reason'],
    )
    assert.deepEqual(
      [...FIRST_RELEASE_TELEMETRY_CONTRACT.newsletter_subscribe_requested.allowedPayloadKeys],
      ['signupSource'],
    )
    assert.equal(isAllowedPayloadKey('curated_promo_card_open', 'promoId'), true)
    assert.equal(isAllowedPayloadKey('curated_promo_card_open', 'sourceUrl'), false)
    assert.equal(isAllowedPayloadKey('newsletter_subscribe_requested', 'email'), false)
  })

  it('bounds filterValue to rendered public option vocabulary (multi-word brands ok)', () => {
    assert.deepEqual([...TELEMETRY_FILTER_KEYS], [
      'brand',
      'marketSlug',
      'signalCategory',
      'signalType',
    ])
    assert.deepEqual([...TELEMETRY_FILTER_ACTIONS], ['apply', 'clear'])

    assert.equal(
      isValidFilterValueForKey('brand', 'Hard Rock', SAMPLE_FILTER_VOCABULARY),
      true,
    )
    assert.equal(
      isValidFilterValueForKey('brand', 'Resorts World', SAMPLE_FILTER_VOCABULARY),
      true,
    )
    assert.equal(
      isValidFilterValueForKey('brand', 'Unknown Casino', SAMPLE_FILTER_VOCABULARY),
      false,
    )
    assert.equal(
      isValidFilterValueForKey('brand', 'user@example.com', SAMPLE_FILTER_VOCABULARY),
      false,
    )
    assert.equal(
      isValidFilterValueForKey('brand', 'free form prose here', SAMPLE_FILTER_VOCABULARY),
      false,
    )
    assert.equal(
      isValidFilterValueForKey('marketSlug', 'las-vegas', SAMPLE_FILTER_VOCABULARY),
      true,
    )
    assert.equal(
      isValidFilterValueForKey('signalCategory', 'room_discount', SAMPLE_FILTER_VOCABULARY),
      true,
    )
    assert.equal(
      isValidFilterValueForKey('signalCategory', 'not_a_category', SAMPLE_FILTER_VOCABULARY),
      false,
    )
    assert.equal(
      isValidFilterValueForKey(
        'signalType',
        'room_rate_percent_off',
        SAMPLE_FILTER_VOCABULARY,
      ),
      true,
    )

    const applyBrand: CuratedPromoFilterClickPayload = {
      filterKey: 'brand',
      action: 'apply',
      filterValue: 'Hard Rock',
    }
    const clearBrand: CuratedPromoFilterClickPayload = {
      filterKey: 'brand',
      action: 'clear',
      filterValue: 'Hard Rock',
    }
    assert.equal(
      isValidCuratedPromoFilterClickPayload(applyBrand, SAMPLE_FILTER_VOCABULARY),
      true,
    )
    assert.equal(
      isValidCuratedPromoFilterClickPayload(clearBrand, SAMPLE_FILTER_VOCABULARY),
      true,
      'clear includes the clicked bounded value',
    )
    assert.equal(
      isValidCuratedPromoFilterClickPayload(
        { filterKey: 'brand', action: 'clear', filterValue: 'Not Rendered' },
        SAMPLE_FILTER_VOCABULARY,
      ),
      false,
    )
    assert.ok(TELEMETRY_SIGNAL_CATEGORIES.includes('room_discount'))
    assert.ok(TELEMETRY_SIGNAL_CATEGORIES.length >= 10)
  })

  it('bounds empty-state, signupSource, and promoId schemas', () => {
    assert.deepEqual([...TELEMETRY_EMPTY_STATE_REASONS], [
      'published_empty',
      'filter_empty',
      'fail_soft',
    ])
    assert.equal(isTelemetryEmptyStateReason('filter_empty'), true)
    assert.equal(isTelemetryEmptyStateReason('unknown'), false)
    assert.equal(
      isValidCuratedPromoEmptyStateViewPayload({ reason: 'published_empty' }),
      true,
    )

    assert.deepEqual([...TELEMETRY_SIGNUP_SOURCES_V1], ['newsletter_landing'])
    assert.equal(isTelemetrySignupSourceV1('newsletter_landing'), true)
    assert.equal(isTelemetrySignupSourceV1('website_footer'), false)
    assert.equal(
      isValidNewsletterSubscribeRequestedPayload({
        signupSource: 'newsletter_landing',
      }),
      true,
    )

    assert.equal(isValidPromoId('promo_abc-123'), true)
    assert.equal(isValidPromoId(''), false)
    assert.equal(isValidPromoId('https://evil.example/x?q=1'), false)
    assert.equal(isValidPromoId('user@example.com'), false)
    assert.equal(isValidPromoIdPayload({ promoId: 'abc_01' }), true)
    assert.equal(isValidPromoIdPayload({ promoId: 'Hard Rock' }), false)
  })

  it('prohibits email, token, URL, referrer, and free-form metadata keys', () => {
    for (const key of [
      'email',
      'emailHash',
      'subscriber_email_hash',
      'confirmationToken',
      'token',
      'access_token',
      'sessionId',
      'session_id',
      'sourceUrl',
      'pageUrl',
      'referrer',
      'userAgent',
      'ip',
      'authorization',
      'metadata',
      'errorBody',
    ]) {
      assert.equal(isProhibitedPayloadKey(key), true, key)
    }
    assert.ok(TELEMETRY_PROHIBITED_PAYLOAD_KEYS.includes('email'))
    assert.ok(TELEMETRY_PROHIBITED_PAYLOAD_KEYS.includes('referrer'))
    assert.ok(TELEMETRY_PROHIBITED_PAYLOAD_KEYS.includes('sourceUrl'))
  })

  it('keeps requested and confirmed meanings distinct', () => {
    assert.equal(shouldEmitNewsletterSubscribeRequested('accepted'), true)
    for (const status of NEWSLETTER_SUBSCRIBE_NON_EMIT_STATUSES) {
      assert.equal(shouldEmitNewsletterSubscribeRequested(status), false, status)
    }
    assert.equal(shouldEmitNewsletterSubscribeRequested('success'), false)

    assert.equal(
      shouldEmitNewsletterSubscriptionConfirmed(NEWSLETTER_CONFIRM_EMIT_STATUS),
      true,
    )
    for (const status of NEWSLETTER_CONFIRM_NON_EMIT_STATUSES) {
      assert.equal(
        shouldEmitNewsletterSubscriptionConfirmed(status),
        false,
        status,
      )
    }
    assert.equal(shouldEmitNewsletterSubscriptionConfirmed('accepted'), false)
    assert.notEqual(
      'newsletter_subscribe_requested',
      'newsletter_subscription_confirmed',
    )
  })

  it('omits session identity and disables the production sink by default', () => {
    assert.equal(TELEMETRY_SESSION_IDENTITY, 'omit')
    assert.equal(TELEMETRY_SINK_STATUS, 'disabled_by_default')
    for (const name of FIRST_RELEASE_TELEMETRY_EVENT_NAMES) {
      assert.equal(
        FIRST_RELEASE_TELEMETRY_CONTRACT[name].sessionIdentity,
        'omit',
      )
      assert.equal(
        FIRST_RELEASE_TELEMETRY_CONTRACT[name].sinkStatus,
        'disabled_by_default',
      )
    }
  })
})
