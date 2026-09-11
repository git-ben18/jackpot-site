/**
 * S5-E contract static assertions — meaning only, no provider/network.
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
  TELEMETRY_FILTER_VALUE_CHARSET,
  TELEMETRY_PROHIBITED_PAYLOAD_KEYS,
  TELEMETRY_PROMO_ID_CHARSET,
  TELEMETRY_SCHEMA_VERSION,
  TELEMETRY_SESSION_IDENTITY,
  TELEMETRY_SIGNUP_SOURCES_V1,
  TELEMETRY_SINK_STATUS,
  isAllowedPayloadKey,
  isFirstReleaseTelemetryEventName,
  isProhibitedPayloadKey,
  isTelemetryTokenValue,
  shouldEmitNewsletterSubscribeRequested,
  shouldEmitNewsletterSubscriptionConfirmed,
} from '../telemetry/first-release-telemetry-contract'

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

  it('bounds every event payload to an explicit allowlist', () => {
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

    assert.deepEqual(
      FIRST_RELEASE_TELEMETRY_CONTRACT.curated_promo_discovery_view.allowedPayloadKeys,
      [],
    )
    assert.deepEqual(
      FIRST_RELEASE_TELEMETRY_CONTRACT.newsletter_subscription_confirmed.allowedPayloadKeys,
      [],
    )
    assert.deepEqual(
      [...FIRST_RELEASE_TELEMETRY_CONTRACT.curated_promo_filter_click.allowedPayloadKeys],
      ['filterKey', 'action', 'filterValue'],
    )
    assert.equal(isAllowedPayloadKey('curated_promo_card_open', 'promoId'), true)
    assert.equal(isAllowedPayloadKey('curated_promo_card_open', 'sourceUrl'), false)
    assert.equal(isAllowedPayloadKey('newsletter_subscribe_requested', 'email'), false)
  })

  it('enumerates bounded filter / empty-state / signup vocabularies', () => {
    assert.deepEqual([...TELEMETRY_FILTER_KEYS], [
      'brand',
      'marketSlug',
      'signalCategory',
      'signalType',
    ])
    assert.deepEqual([...TELEMETRY_FILTER_ACTIONS], ['apply', 'clear'])
    assert.deepEqual([...TELEMETRY_EMPTY_STATE_REASONS], [
      'published_empty',
      'filter_empty',
      'fail_soft',
    ])
    assert.deepEqual([...TELEMETRY_SIGNUP_SOURCES_V1], ['newsletter_landing'])
    assert.equal(
      isTelemetryTokenValue('room_discount', 64, TELEMETRY_FILTER_VALUE_CHARSET),
      true,
    )
    assert.equal(
      isTelemetryTokenValue('user@example.com', 64, TELEMETRY_FILTER_VALUE_CHARSET),
      false,
    )
    assert.equal(
      isTelemetryTokenValue('promo_abc-123', 128, TELEMETRY_PROMO_ID_CHARSET),
      true,
    )
    assert.equal(
      isTelemetryTokenValue('https://evil.example/x?q=1', 128, TELEMETRY_PROMO_ID_CHARSET),
      false,
    )
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
