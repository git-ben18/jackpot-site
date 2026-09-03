/**
 * Curated promo DTOs — public UI contract only.
 * Populated from public.v_curated_promo_discovery via curatedPromoDiscoveryMapper.
 * Source: rewards-maxxing-frontend@466bfb0 src/types/curatedPromos.ts (COPY).
 */
import type { CuratedPromoSignalCategory } from '../lib/constants/curatedPromoSignalCategory'
export type CuratedPromoActiveStatus =
  | 'active'
  | 'upcoming'
  | 'expired'
  | 'unknown'

export type CuratedPromoSourceKind =
  | 'website'
  | 'social'
  | 'reddit'
  | 'email'
  | 'manual'
  | 'unknown'

export type CuratedPromoSignalDTO = {
  signalId: string

  signalFamily: string | null
  signalType: string | null

  label: string | null
  valueRaw: string
  valueNormalized: string | null

  confidence: string | number | null
  evidenceText: string | null

  appliesTo: string | null
  extractionKey: string | null
}

export type CuratedPromoEvidenceDTO = {
  text: string
  sourceField: string | null
  assetRef: string | null
  confidence: string | number | null
}

export type CuratedPromoDiscoveryDTO = {
  promoId: string
  promoSlug: string | null

  brand: string
  marketSlug: string | null
  locationLabel: string | null

  title: string
  subtitle: string | null

  sourceKind: CuratedPromoSourceKind | string | null
  sourceUrl: string | null
  primaryAssetUrl: string | null

  activeStatus: CuratedPromoActiveStatus

  visibleStartDate: string | null
  visibleEndDate: string | null
  observedAt: string | null

  signalFamilies: string[]
  signalTypes: string[]
  gameplayTags: string[]
  badges: string[]

  topSignals: CuratedPromoSignalDTO[]
  signals: CuratedPromoSignalDTO[]

  evidence: CuratedPromoEvidenceDTO[]

  /**
   * Optional and unused in initial S3 (D-S3-02).
   * Overlap runtime types are not copied; keep the field so the public DTO stays compatible.
   */
  eventOverlaps?: unknown[]
}

export type CuratedPromoFilters = {
  brand: string | null
  marketSlug: string | null
  /** UX category chip (curatedPromoSignalCategory.ts) — not raw signal_family. */
  signalCategory: CuratedPromoSignalCategory | null
  /** Secondary refinement: exact parser signal_type within the selected category. */
  signalType: string | null
  sourceKind: string | null
}

export const EMPTY_CURATED_PROMO_FILTERS: CuratedPromoFilters = {
  brand: null,
  marketSlug: null,
  signalCategory: null,
  signalType: null,
  sourceKind: null,
}
