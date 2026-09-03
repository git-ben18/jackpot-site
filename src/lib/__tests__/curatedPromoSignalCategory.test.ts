import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CATEGORY_META,
  CURATED_SIGNAL_TYPE_INVENTORY,
  DEFAULT_CHIP_CATEGORIES,
  MIN_OPTIONAL_CATEGORY_CHIP_COUNT,
  SIGNAL_TYPE_TO_CATEGORY,
  getVisibleCategoryChips,
  inferPromoCategories,
  mapSignalTypeToCategory,
  signalTypeBelongsToCategory,
} from '../constants/curatedPromoSignalCategory'
import type { CuratedPromoDiscoveryDTO } from '../../types/curatedPromos'

function mockPromo(overrides: Partial<CuratedPromoDiscoveryDTO>): CuratedPromoDiscoveryDTO {
  return {
    promoId: 'test-promo',
    promoSlug: null,
    brand: 'Test',
    marketSlug: 'las-vegas',
    locationLabel: null,
    title: 'Test promo',
    subtitle: null,
    sourceKind: 'website',
    sourceUrl: null,
    primaryAssetUrl: null,
    activeStatus: 'active',
    visibleStartDate: null,
    visibleEndDate: null,
    observedAt: null,
    signalFamilies: [],
    signalTypes: [],
    gameplayTags: [],
    badges: [],
    topSignals: [],
    signals: [],
    evidence: [],
    ...overrides,
  }
}

describe('curatedPromoSignalCategory', () => {
  it('maps every 68-type inventory signal_type to a category', () => {
    assert.equal(CURATED_SIGNAL_TYPE_INVENTORY.length, 68)
    for (const signalType of CURATED_SIGNAL_TYPE_INVENTORY) {
      assert.ok(
        SIGNAL_TYPE_TO_CATEGORY[signalType],
        `missing map for ${signalType}`,
      )
    }
  })

  it('keeps default chip list stable, sorted, and free of sheet_only', () => {
    assert.deepEqual(DEFAULT_CHIP_CATEGORIES, [
      'room_discount',
      'dining_food',
      'event_package',
      'hotel_package',
      'shows_tickets',
      'loyalty_rewards',
      'stay_rules',
    ])

    for (const category of DEFAULT_CHIP_CATEGORIES) {
      assert.equal(CATEGORY_META[category].defaultChip, true)
      assert.notEqual(category, 'sheet_only')
    }

    const sortOrders = DEFAULT_CHIP_CATEGORIES.map((c) => CATEGORY_META[c].sortOrder)
    assert.deepEqual(sortOrders, [...sortOrders].sort((a, b) => a - b))
  })

  it('never exposes sheet_only in visible category chips', () => {
    const promos = [
      mockPromo({ promoId: 'a', signalTypes: ['campaign_label', 'brand_positioning'] }),
      mockPromo({ promoId: 'b', signalTypes: ['dining_credit', 'booking_window'] }),
      mockPromo({ promoId: 'c', signalTypes: ['stay_window', 'booking_deadline'] }),
    ]
    const chips = getVisibleCategoryChips(promos)
    assert.equal(chips.includes('sheet_only'), false)
  })

  it('falls back unknown signal_type safely to sheet_only', () => {
    assert.equal(mapSignalTypeToCategory('not_in_inventory_xyz'), 'sheet_only')
    assert.equal(mapSignalTypeToCategory(''), 'sheet_only')
  })

  it('signalTypeBelongsToCategory links event_package secondary types to Event package chip', () => {
    assert.equal(signalTypeBelongsToCategory('package_option', 'event_package'), true)
    assert.equal(signalTypeBelongsToCategory('event_performance', 'event_package'), true)
    assert.equal(signalTypeBelongsToCategory('included_event_tickets', 'event_package'), true)
    assert.equal(signalTypeBelongsToCategory('package_option', 'room_discount'), false)
    assert.equal(signalTypeBelongsToCategory('discount_percent', 'event_package'), false)
  })

  it('infers event_package from included_event_tickets', () => {
    const categories = inferPromoCategories(['included_event_tickets', 'discount_percent'])
    assert.ok(categories.includes('event_package'))
    assert.ok(categories.includes('room_discount'))
  })

  it('infers event_package from package_option + event_performance', () => {
    const categories = inferPromoCategories(['package_option', 'event_performance', 'resort_credit'])
    assert.ok(categories.includes('event_package'))
    assert.ok(categories.includes('dining_food'))
  })

  it('uses slug/title hints only as fallback for event_package', () => {
    const fromSignals = inferPromoCategories(['discount_percent'], 'Spring room sale', null)
    assert.equal(fromSignals.includes('event_package'), false)

    const fromHints = inferPromoCategories(
      ['discount_percent'],
      'Sphere Wizard of Oz package',
      '20260510-fontainebleau-sphere-wizard-of-oz-package',
    )
    assert.ok(fromHints.includes('event_package'))
  })

  it('adds optional book_by chip only with meaningful counts', () => {
    const belowThreshold = [
      mockPromo({ promoId: '1', signalTypes: ['booking_window'] }),
      mockPromo({ promoId: '2', signalTypes: ['dining_credit'] }),
    ]
    assert.equal(getVisibleCategoryChips(belowThreshold).includes('book_by'), false)

    const promos = Array.from({ length: MIN_OPTIONAL_CATEGORY_CHIP_COUNT }, (_, i) =>
      mockPromo({ promoId: `book-${i}`, signalTypes: ['booking_window'] }),
    )
    assert.ok(getVisibleCategoryChips(promos).includes('book_by'))
  })

  it('adds travel_dates optional chip only for event/date-driven promos at threshold', () => {
    const genericDates = Array.from({ length: MIN_OPTIONAL_CATEGORY_CHIP_COUNT }, (_, i) =>
      mockPromo({ promoId: `travel-${i}`, signalTypes: ['travel_window'] }),
    )
    assert.equal(getVisibleCategoryChips(genericDates).includes('travel_dates'), false)

    const eventDriven = Array.from({ length: MIN_OPTIONAL_CATEGORY_CHIP_COUNT }, (_, i) =>
      mockPromo({
        promoId: `event-${i}`,
        signalTypes: ['event_window', 'included_event_tickets'],
        title: 'Concert package',
      }),
    )
    assert.ok(getVisibleCategoryChips(eventDriven).includes('travel_dates'))
  })
})
