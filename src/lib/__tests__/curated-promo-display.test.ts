import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { promoMatchesCuratedFilters } from '../curated-promo-display'
import type { CuratedPromoDiscoveryDTO } from '../../types/curatedPromos'

function mockPromo(overrides: Partial<CuratedPromoDiscoveryDTO>): CuratedPromoDiscoveryDTO {
  return {
    promoId: 'test-promo',
    promoSlug: null,
    brand: 'Test',
    marketSlug: 'las-vegas',
    locationLabel: null,
    title: 'Concert bundle',
    subtitle: null,
    sourceKind: 'website',
    sourceUrl: null,
    primaryAssetUrl: null,
    activeStatus: 'active',
    visibleStartDate: null,
    visibleEndDate: null,
    observedAt: null,
    signalFamilies: [],
    signalTypes: ['package_option', 'event_performance'],
    gameplayTags: [],
    badges: [],
    topSignals: [],
    signals: [],
    evidence: [],
    ...overrides,
  }
}

describe('promoMatchesCuratedFilters', () => {
  it('Event package + package_option still matches promos inferred as event_package', () => {
    const promo = mockPromo({
      promoId: 'ev-1',
      signalTypes: ['package_option', 'event_performance'],
    })

    assert.equal(
      promoMatchesCuratedFilters(promo, {
        brand: null,
        marketSlug: null,
        signalCategory: 'event_package',
        signalType: 'package_option',
        sourceKind: null,
      }),
      true,
    )
  })

  it('event_performance secondary refine under Event package passes', () => {
    const promo = mockPromo({
      promoId: 'ev-2',
      signalTypes: ['package_option', 'event_performance'],
    })

    assert.equal(
      promoMatchesCuratedFilters(promo, {
        brand: null,
        marketSlug: null,
        signalCategory: 'event_package',
        signalType: 'event_performance',
        sourceKind: null,
      }),
      true,
    )
  })
})
