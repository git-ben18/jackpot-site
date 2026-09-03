import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { curatedPromoDiscoveryViewRows } from '../__fixtures__/curatedPromoDiscoveryRow.fixtures'
import {
  mapCuratedPromoDiscoveryRow,
  type CuratedPromoDiscoveryRow,
} from '../mappers/curatedPromoDiscoveryMapper'

describe('curatedPromoDiscoveryMapper', () => {
  it('maps full promo with v0 signals and confidence', () => {
    const dto = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0])

    assert.equal(dto.promoId, 'mock-promo-venetian-freeplay')
    assert.equal(dto.signals.length, 2)
    assert.equal(dto.signals[0].signalId, 'mock-promo-venetian-freeplay:v0:0:offer_details.match_play')
    assert.equal(dto.signals[0].valueRaw, '$50 match play')
    assert.equal(dto.signals[0].valueNormalized, '$50')
    assert.equal(dto.signals[0].confidence, 0.92)
    assert.equal(dto.signals[1].confidence, '0.88')
    assert.equal(dto.sourceKind, 'website')
    assert.equal(!('debug' in dto), true)
    assert.equal(!('lineage' in dto), true)
    assert.equal(dto.eventOverlaps, undefined)
  })

  it('uses top_signals_json when populated', () => {
    const dto = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0])

    assert.equal(dto.topSignals.length, 1)
    assert.equal(dto.topSignals[0].signalType, 'match_play')
    assert.notEqual(dto.topSignals[0].signalId, '')
  })

  it('falls back to first three signals when top_signals_json is empty', () => {
    const row: CuratedPromoDiscoveryRow = {
      ...curatedPromoDiscoveryViewRows[0],
      top_signals_json: [],
      signals_json: [
        { signal_id: 'a', signal_type: 't1', value_raw: 'one' },
        { signal_id: 'b', signal_type: 't2', value_raw: 'two' },
        { signal_id: 'c', signal_type: 't3', value_raw: 'three' },
        { signal_id: 'd', signal_type: 't4', value_raw: 'four' },
      ],
    }

    const dto = mapCuratedPromoDiscoveryRow(row)

    assert.equal(dto.topSignals.length, 3)
    assert.equal(dto.topSignals[0].signalId, 'a')
    assert.equal(dto.topSignals[2].signalId, 'c')
  })

  it('maps evidence text from text field', () => {
    const dto = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0])

    assert.equal(dto.evidence.length, 1)
    assert.equal(dto.evidence[0].text, 'Enjoy a $75 Daily Dining Credit for each night stayed.')
    assert.equal(dto.evidence[0].confidence, '0.95')
  })

  it('maps evidence text from label when text is absent', () => {
    const row: CuratedPromoDiscoveryRow = {
      ...curatedPromoDiscoveryViewRows[1],
      promo_id: 'evidence-label-only',
      evidence_json: [
        {
          evidence_type: 'text',
          label: 'Fallback label evidence',
          extraction_key: 'footer.disclaimer',
        },
      ],
    }

    const dto = mapCuratedPromoDiscoveryRow(row)

    assert.equal(dto.evidence.length, 1)
    assert.equal(dto.evidence[0].text, 'Fallback label evidence')
  })

  it('maps sourceField from extraction_key when source_field is absent', () => {
    const dto = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0])

    assert.equal(dto.evidence[0].sourceField, 'offer_details.dining_credit')
  })

  it('defaults missing brand and title', () => {
    const row: CuratedPromoDiscoveryRow = {
      ...curatedPromoDiscoveryViewRows[1],
      promo_id: 'missing-brand-title',
      brand: null,
      title: null,
    }

    const dto = mapCuratedPromoDiscoveryRow(row)

    assert.equal(dto.brand, 'Unknown brand')
    assert.equal(dto.title, 'Untitled promo')
  })

  it('normalizes invalid active_status to unknown', () => {
    const row: CuratedPromoDiscoveryRow = {
      ...curatedPromoDiscoveryViewRows[1],
      promo_id: 'bad-status',
      active_status: 'LIVE_NOW',
    }

    const dto = mapCuratedPromoDiscoveryRow(row)

    assert.equal(dto.activeStatus, 'unknown')
  })

  it('returns empty signals and evidence without throwing', () => {
    const dto = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[1])

    assert.deepEqual(dto.signals, [])
    assert.deepEqual(dto.topSignals, [])
    assert.deepEqual(dto.evidence, [])
  })

  it('passes through unknown source_kind strings', () => {
    const row: CuratedPromoDiscoveryRow = {
      ...curatedPromoDiscoveryViewRows[1],
      promo_id: 'instagram-source',
      source_kind: 'instagram',
    }

    const dto = mapCuratedPromoDiscoveryRow(row)

    assert.equal(dto.sourceKind, 'instagram')
  })

  it('maps value_normalized without requiring value_display in JSON', () => {
    const row: CuratedPromoDiscoveryRow = {
      ...curatedPromoDiscoveryViewRows[1],
      promo_id: 'value-normalized-only',
      signals_json: [
        {
          signal_id: 'sig-1',
          signal_type: 'dining_credit',
          value_raw: '$75 per night',
          value_normalized: '$75 per night',
        },
      ],
    }

    const dto = mapCuratedPromoDiscoveryRow(row)

    assert.equal(dto.signals[0].valueNormalized, '$75 per night')
    assert.equal(dto.signals[0].valueRaw, '$75 per night')
  })

  it('throws when promo_id is missing', () => {
    const row = {
      ...curatedPromoDiscoveryViewRows[0],
      promo_id: '',
    } as CuratedPromoDiscoveryRow

    assert.throws(() => mapCuratedPromoDiscoveryRow(row), /missing promo_id/)
  })
})
