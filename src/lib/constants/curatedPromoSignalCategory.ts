/**
 * Epic A signal_type → UX category taxonomy (68-type promo-curate inventory).
 * Controls filter chips, sheet grouping, and analytics — not database schema.
 * @see _docs/planning/epic-a-curated-promo-discovery/SIGNAL_TYPE_LOW_FREQUENCY_REPORT.md
 */

import type { CuratedPromoDiscoveryDTO, CuratedPromoSignalDTO } from '../../types/curatedPromos'

export type CuratedPromoSignalCategory =
  | 'room_discount'
  | 'dining_food'
  | 'event_package'
  | 'hotel_package'
  | 'shows_tickets'
  | 'loyalty_rewards'
  | 'stay_rules'
  | 'book_by'
  | 'stay_by'
  | 'travel_dates'
  | 'travel_perks'
  | 'perks_extras'
  | 'fees_policies'
  | 'eligibility'
  | 'booking_rules'
  | 'event_identity'
  | 'event_vip'
  | 'sheet_only'

export type CategoryMeta = {
  label: string | null
  defaultChip: boolean
  sortOrder: number
  /** Shown as a filter chip only when enough promos qualify (book_by, stay_by, travel_dates). */
  optionalChip?: boolean
  /** Prefer sheet layout; optional chip only for event/date-driven promos (travel_dates). */
  sheetPrimary?: boolean
}

export const CATEGORY_META: Record<CuratedPromoSignalCategory, CategoryMeta> = {
  room_discount: { label: 'Room discount', defaultChip: true, sortOrder: 10 },
  dining_food: { label: 'Dining & food', defaultChip: true, sortOrder: 20 },
  event_package: { label: 'Event package', defaultChip: true, sortOrder: 30 },
  hotel_package: { label: 'Hotel package', defaultChip: true, sortOrder: 40 },
  shows_tickets: { label: 'Shows & tickets', defaultChip: true, sortOrder: 50 },
  loyalty_rewards: { label: 'Loyalty & gaming', defaultChip: true, sortOrder: 60 },
  stay_rules: { label: 'Stay rules', defaultChip: true, sortOrder: 70 },
  book_by: { label: 'Book by', defaultChip: false, optionalChip: true, sortOrder: 80 },
  stay_by: { label: 'Stay by', defaultChip: false, optionalChip: true, sortOrder: 90 },
  travel_dates: {
    label: 'Travel dates',
    defaultChip: false,
    optionalChip: true,
    sheetPrimary: true,
    sortOrder: 100,
  },
  travel_perks: { label: 'Travel perks', defaultChip: false, sortOrder: 110 },
  perks_extras: { label: 'Extras', defaultChip: false, sortOrder: 120 },
  fees_policies: { label: 'Policies', defaultChip: false, sortOrder: 130 },
  eligibility: { label: 'Eligibility', defaultChip: false, sortOrder: 140 },
  booking_rules: { label: 'Booking rules', defaultChip: false, sortOrder: 150 },
  event_identity: { label: 'Event info', defaultChip: false, sortOrder: 160 },
  event_vip: { label: 'Event VIP', defaultChip: false, sortOrder: 170 },
  sheet_only: { label: null, defaultChip: false, sortOrder: 999 },
}

/** Minimum promos in the current set before an optional date chip is shown. */
export const MIN_OPTIONAL_CATEGORY_CHIP_COUNT = 2

/**
 * Locked default public chip shortlist (stable order via CATEGORY_META.sortOrder).
 * book_by / stay_by / travel_dates are appended when optional-chip rules pass.
 */
export const DEFAULT_CHIP_CATEGORIES = (
  Object.entries(CATEGORY_META) as [CuratedPromoSignalCategory, CategoryMeta][]
)
  .filter(([, meta]) => meta.defaultChip)
  .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
  .map(([key]) => key)

const EVENT_PACKAGE_SIGNAL_TYPES = new Set([
  'included_event_tickets',
  'package_option',
  'event_performance',
])

const EVENT_PACKAGE_TITLE_HINT =
  /\b(sphere|wizard of oz|show package|concert package|event package|tickets?\s*\+\s*(room|stay)|room\s*\+\s*tickets?)\b/i
const EVENT_PACKAGE_SLUG_HINT =
  /(sphere|event-package|show-package|concert-package|included-tickets|tickets-package)/i

const DATE_SIGNAL_TYPES = new Set([
  'booking_window',
  'booking_deadline',
  'stay_window',
  'travel_window',
  'event_window',
  'valid_months',
  'advance_purchase_days',
])

const EVENT_DATE_SIGNAL_TYPES = new Set(['event_window', 'included_admission', 'event_performance'])

/**
 * Full 68-type inventory from promo-curate batch (SIGNAL_TYPE_LOW_FREQUENCY_REPORT.md).
 * Every entry must map via SIGNAL_TYPE_TO_CATEGORY.
 */
export const CURATED_SIGNAL_TYPE_INVENTORY = [
  'advance_purchase_days',
  'arrival_restriction',
  'beverage_inclusion',
  'blackout_policy',
  'bogo_drinks',
  'bogo_room_suite_rate',
  'booking_channel',
  'booking_deadline',
  'booking_window',
  'brand_positioning',
  'breakfast_voucher',
  'cabana_daybed_discount',
  'campaign_label',
  'cancellation_policy',
  'cash_reward',
  'complimentary_valet',
  'credit_restriction',
  'daily_resort_credit',
  'deposit_policy',
  'dining_credit',
  'dining_package',
  'direct_booking_benefit',
  'discount_percent',
  'dollar_off',
  'dollar_off_room_type',
  'early_access',
  'eligible_properties',
  'eligible_room_types',
  'event_performance',
  'event_window',
  'fee_policy',
  'food_beverage_credit',
  'food_beverage_menu',
  'free_parking',
  'gaming_cashback',
  'included_admission',
  'included_event_tickets',
  'late_checkout',
  'length_of_stay_discount',
  'loyalty_requirement',
  'max_credit_value',
  'member_discount_percent',
  'minimum_stay',
  'official_venue',
  'package_option',
  'package_positioning',
  'package_surcharge',
  'perk_bundle',
  'perk_bundle_value',
  'play_points_threshold',
  'points_earnback',
  'pool_experience',
  'promo_code',
  'redemption_window',
  'resort_credit',
  'resort_fee_policy',
  'restaurant_launch_context',
  'sale_status',
  'starting_rate',
  'starting_ticket_price',
  'stay_window',
  'tax_policy',
  'ticket_price',
  'trackside_access',
  'travel_window',
  'valid_months',
  'vip_food_beverage',
  'vip_seating',
] as const

export type CuratedSignalTypeInventory = (typeof CURATED_SIGNAL_TYPE_INVENTORY)[number]

export const SIGNAL_TYPE_TO_CATEGORY: Record<CuratedSignalTypeInventory, CuratedPromoSignalCategory> = {
  advance_purchase_days: 'book_by',
  arrival_restriction: 'stay_rules',
  beverage_inclusion: 'hotel_package',
  blackout_policy: 'booking_rules',
  bogo_drinks: 'dining_food',
  bogo_room_suite_rate: 'hotel_package',
  booking_channel: 'booking_rules',
  booking_deadline: 'book_by',
  booking_window: 'book_by',
  brand_positioning: 'sheet_only',
  breakfast_voucher: 'dining_food',
  cabana_daybed_discount: 'hotel_package',
  campaign_label: 'sheet_only',
  cancellation_policy: 'fees_policies',
  cash_reward: 'loyalty_rewards',
  complimentary_valet: 'travel_perks',
  credit_restriction: 'fees_policies',
  daily_resort_credit: 'dining_food',
  deposit_policy: 'booking_rules',
  dining_credit: 'dining_food',
  dining_package: 'hotel_package',
  direct_booking_benefit: 'perks_extras',
  discount_percent: 'room_discount',
  dollar_off: 'room_discount',
  dollar_off_room_type: 'room_discount',
  early_access: 'perks_extras',
  eligible_properties: 'eligibility',
  eligible_room_types: 'eligibility',
  event_performance: 'sheet_only',
  event_window: 'travel_dates',
  fee_policy: 'fees_policies',
  food_beverage_credit: 'dining_food',
  food_beverage_menu: 'dining_food',
  free_parking: 'travel_perks',
  gaming_cashback: 'loyalty_rewards',
  included_admission: 'shows_tickets',
  included_event_tickets: 'event_package',
  late_checkout: 'travel_perks',
  length_of_stay_discount: 'room_discount',
  loyalty_requirement: 'eligibility',
  max_credit_value: 'dining_food',
  member_discount_percent: 'loyalty_rewards',
  minimum_stay: 'stay_rules',
  official_venue: 'event_identity',
  package_option: 'sheet_only',
  package_positioning: 'sheet_only',
  package_surcharge: 'hotel_package',
  perk_bundle: 'perks_extras',
  perk_bundle_value: 'perks_extras',
  play_points_threshold: 'loyalty_rewards',
  points_earnback: 'loyalty_rewards',
  pool_experience: 'hotel_package',
  promo_code: 'booking_rules',
  redemption_window: 'loyalty_rewards',
  resort_credit: 'dining_food',
  resort_fee_policy: 'fees_policies',
  restaurant_launch_context: 'sheet_only',
  sale_status: 'event_vip',
  starting_rate: 'room_discount',
  starting_ticket_price: 'shows_tickets',
  stay_window: 'stay_by',
  tax_policy: 'fees_policies',
  ticket_price: 'shows_tickets',
  trackside_access: 'event_vip',
  travel_window: 'travel_dates',
  valid_months: 'travel_dates',
  vip_food_beverage: 'event_vip',
  vip_seating: 'event_vip',
}

const INVENTORY_SET = new Set<string>(CURATED_SIGNAL_TYPE_INVENTORY)

export function mapSignalTypeToCategory(signalType: string): CuratedPromoSignalCategory {
  const normalized = signalType.trim()
  if (!normalized) return 'sheet_only'
  if (INVENTORY_SET.has(normalized)) {
    return SIGNAL_TYPE_TO_CATEGORY[normalized as CuratedSignalTypeInventory]
  }
  if (normalized.includes('discount') || normalized.includes('rate')) return 'room_discount'
  if (normalized.includes('dining') || normalized.includes('food') || normalized.includes('credit')) {
    return 'dining_food'
  }
  if (normalized.includes('freeplay') || normalized.includes('match_play') || normalized.includes('spin')) {
    return 'loyalty_rewards'
  }
  if (normalized.includes('event') || normalized.includes('ticket') || normalized.includes('show')) {
    return 'shows_tickets'
  }
  if (normalized.includes('pool') || normalized.includes('package')) return 'hotel_package'
  if (DATE_SIGNAL_TYPES.has(normalized)) {
    if (normalized === 'stay_window') return 'stay_by'
    if (normalized === 'booking_window' || normalized === 'booking_deadline') return 'book_by'
    return 'travel_dates'
  }
  return 'sheet_only'
}

/** True when `signalType` is valid as a secondary refine for `category` (aligns with chip + filter UX). */
export function signalTypeBelongsToCategory(
  signalType: string,
  category: CuratedPromoSignalCategory,
): boolean {
  if (mapSignalTypeToCategory(signalType) === category) return true

  if (category === 'event_package' && EVENT_PACKAGE_SIGNAL_TYPES.has(signalType)) {
    return true
  }

  return false
}

function hasEventPackageTitleHint(title?: string | null): boolean {
  return Boolean(title && EVENT_PACKAGE_TITLE_HINT.test(title))
}

function hasEventPackageSlugHint(slug?: string | null): boolean {
  return Boolean(slug && EVENT_PACKAGE_SLUG_HINT.test(slug))
}

/**
 * Infer UX categories beyond direct signal_type mapping.
 * Slug/title hints are fallback only (after signal-based rules).
 */
export function inferPromoCategories(
  signalTypes: string[],
  promoTitle?: string | null,
  promoSlug?: string | null,
): CuratedPromoSignalCategory[] {
  const categories = new Set<CuratedPromoSignalCategory>()

  for (const signalType of signalTypes) {
    const category = mapSignalTypeToCategory(signalType)
    if (category !== 'sheet_only') {
      categories.add(category)
    }
  }

  const typeSet = new Set(signalTypes)

  if (typeSet.has('included_event_tickets')) {
    categories.add('event_package')
  }

  if (typeSet.has('package_option') && typeSet.has('event_performance')) {
    categories.add('event_package')
  } else if (typeSet.has('package_option') && typeSet.has('included_event_tickets')) {
    categories.add('event_package')
  }

  if (!categories.has('event_package')) {
    if (hasEventPackageTitleHint(promoTitle) || hasEventPackageSlugHint(promoSlug)) {
      categories.add('event_package')
    }
  }

  return sortCategories(Array.from(categories))
}

export function getPromoSignalCategories(promo: CuratedPromoDiscoveryDTO): CuratedPromoSignalCategory[] {
  return inferPromoCategories(promo.signalTypes, promo.title, promo.promoSlug ?? undefined)
}

export function promoHasSignalCategory(
  promo: CuratedPromoDiscoveryDTO,
  category: CuratedPromoSignalCategory,
): boolean {
  if (category === 'sheet_only') return false
  return getPromoSignalCategories(promo).includes(category)
}

export function isSheetOnlyCategory(category: CuratedPromoSignalCategory): boolean {
  return category === 'sheet_only'
}

export function isFilterableCategory(category: CuratedPromoSignalCategory): boolean {
  return category !== 'sheet_only'
}

export function getCategoryLabel(category: CuratedPromoSignalCategory): string {
  return CATEGORY_META[category].label ?? humanizeCategoryKey(category)
}

function humanizeCategoryKey(category: CuratedPromoSignalCategory): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function sortCategories(categories: CuratedPromoSignalCategory[]): CuratedPromoSignalCategory[] {
  return [...categories].sort(
    (a, b) => (CATEGORY_META[a]?.sortOrder ?? 999) - (CATEGORY_META[b]?.sortOrder ?? 999),
  )
}

function countPromosWithCategory(
  promos: CuratedPromoDiscoveryDTO[],
  category: CuratedPromoSignalCategory,
): number {
  return promos.filter((promo) => promoHasSignalCategory(promo, category)).length
}

export function isEventDateDrivenPromo(promo: CuratedPromoDiscoveryDTO): boolean {
  const categories = getPromoSignalCategories(promo)
  if (categories.includes('event_package') || categories.includes('shows_tickets')) {
    return true
  }
  return promo.signalTypes.some((type) => EVENT_DATE_SIGNAL_TYPES.has(type))
}

function shouldShowOptionalCategoryChip(
  category: CuratedPromoSignalCategory,
  promos: CuratedPromoDiscoveryDTO[],
): boolean {
  const meta = CATEGORY_META[category]
  if (!meta.optionalChip) return false

  const count = countPromosWithCategory(promos, category)
  if (count < MIN_OPTIONAL_CATEGORY_CHIP_COUNT) return false

  if (category === 'travel_dates') {
    const eventDrivenCount = promos.filter(
      (promo) => promoHasSignalCategory(promo, 'travel_dates') && isEventDateDrivenPromo(promo),
    ).length
    return eventDrivenCount >= MIN_OPTIONAL_CATEGORY_CHIP_COUNT
  }

  return true
}

/**
 * Default + conditional filter chips for the landing widget.
 * Never includes sheet_only.
 */
export function getVisibleCategoryChips(promos: CuratedPromoDiscoveryDTO[]): CuratedPromoSignalCategory[] {
  const chips: CuratedPromoSignalCategory[] = [...DEFAULT_CHIP_CATEGORIES]

  for (const category of ['book_by', 'stay_by', 'travel_dates'] as const) {
    if (shouldShowOptionalCategoryChip(category, promos)) {
      chips.push(category)
    }
  }

  return sortCategories(chips)
}

export function getSignalTypesForCategory(
  promos: CuratedPromoDiscoveryDTO[],
  category: CuratedPromoSignalCategory,
): string[] {
  const types = new Set<string>()
  for (const promo of promos) {
    if (!promoHasSignalCategory(promo, category)) continue
    for (const signalType of promo.signalTypes) {
      if (mapSignalTypeToCategory(signalType) === category) {
        types.add(signalType)
      }
    }
    if (category === 'event_package') {
      for (const signalType of promo.signalTypes) {
        if (EVENT_PACKAGE_SIGNAL_TYPES.has(signalType)) {
          types.add(signalType)
        }
      }
    }
  }
  return Array.from(types).sort((a, b) => a.localeCompare(b))
}

export function getCategoryForSignal(signal: CuratedPromoSignalDTO): CuratedPromoSignalCategory {
  if (signal.signalType) {
    return mapSignalTypeToCategory(signal.signalType)
  }
  return 'sheet_only'
}

/** Sheet section labels for date-related signal types (detail sheet). */
export const SIGNAL_TYPE_SHEET_LABEL: Partial<Record<string, string>> = {
  booking_window: 'Booking window',
  booking_deadline: 'Booking deadline',
  advance_purchase_days: 'Advance purchase',
  stay_window: 'Stay window',
  travel_window: 'Travel window',
  event_window: 'Event window',
  valid_months: 'Valid months',
}

export function getSignalSheetLabel(signal: CuratedPromoSignalDTO): string {
  if (signal.signalType && SIGNAL_TYPE_SHEET_LABEL[signal.signalType]) {
    return SIGNAL_TYPE_SHEET_LABEL[signal.signalType]!
  }
  return signal.label ?? signal.signalType ?? 'Signal'
}

export function groupSignalsByCategory(
  signals: CuratedPromoSignalDTO[],
): { category: CuratedPromoSignalCategory; label: string; signals: CuratedPromoSignalDTO[] }[] {
  const buckets = new Map<CuratedPromoSignalCategory, CuratedPromoSignalDTO[]>()

  for (const signal of signals) {
    const category = getCategoryForSignal(signal)
    if (category === 'sheet_only') continue
    const list = buckets.get(category) ?? []
    list.push(signal)
    buckets.set(category, list)
  }

  return sortCategories(Array.from(buckets.keys())).map((category) => ({
    category,
    label: getCategoryLabel(category),
    signals: buckets.get(category) ?? [],
  }))
}

/** Detail sheet: categorized groups plus sheet_only signals (never filter chips). */
export function groupSignalsForDetailSheet(
  signals: CuratedPromoSignalDTO[],
): { category: CuratedPromoSignalCategory; label: string; signals: CuratedPromoSignalDTO[] }[] {
  const groups = groupSignalsByCategory(signals)
  const sheetOnly = signals.filter((signal) => getCategoryForSignal(signal) === 'sheet_only')
  if (sheetOnly.length > 0) {
    groups.push({
      category: 'sheet_only',
      label: 'Additional details',
      signals: sheetOnly,
    })
  }
  return groups
}
