/**
 * Maps PostgREST rows from public.v_curated_promo_discovery only.
 * Produces public CuratedPromoDiscoveryDTO per 01-data-contract.md — no lineage/debug fields.
 */
import type {
  CuratedPromoActiveStatus,
  CuratedPromoDiscoveryDTO,
  CuratedPromoEvidenceDTO,
  CuratedPromoSignalDTO,
} from '../../types/curatedPromos'

/** Snake_case row fields used by the public widget mapper (04_dto_mapper.md). */
export type CuratedPromoDiscoveryRow = {
  promo_id: string
  promo_slug: string | null

  brand: string | null
  market_slug: string | null
  location_label: string | null

  title: string | null
  subtitle: string | null

  source_kind: string | null
  source_url: string | null
  primary_asset_url: string | null

  active_status: string | null

  visible_start_date: string | null
  visible_end_date: string | null
  observed_at: string | null

  signal_families: string[] | null
  signal_types: string[] | null
  gameplay_tags: string[] | null
  badges: string[] | null

  top_signals_json: unknown
  signals_json: unknown
  evidence_json: unknown
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function asSignals(value: unknown): CuratedPromoSignalDTO[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map((item) => ({
      signalId: String(item.signal_id ?? item.id ?? ''),
      signalFamily: typeof item.signal_family === 'string' ? item.signal_family : null,
      signalType: typeof item.signal_type === 'string' ? item.signal_type : null,
      label: typeof item.label === 'string' ? item.label : null,
      valueRaw: String(item.value_raw ?? ''),
      valueNormalized: typeof item.value_normalized === 'string' ? item.value_normalized : null,
      confidence:
        typeof item.confidence === 'string' || typeof item.confidence === 'number'
          ? item.confidence
          : null,
      evidenceText: typeof item.evidence_text === 'string' ? item.evidence_text : null,
      appliesTo: typeof item.applies_to === 'string' ? item.applies_to : null,
      extractionKey: typeof item.extraction_key === 'string' ? item.extraction_key : null,
    }))
    .filter((signal) => signal.signalId.length > 0 || signal.valueRaw.length > 0)
}

function asEvidence(value: unknown): CuratedPromoEvidenceDTO[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map((item) => {
      const label = typeof item.label === 'string' ? item.label : null
      const evidenceText = typeof item.evidence_text === 'string' ? item.evidence_text : null
      const text = String(item.text ?? evidenceText ?? label ?? '')
      const extractionKey =
        typeof item.extraction_key === 'string' ? item.extraction_key : null

      return {
        text,
        sourceField:
          (typeof item.source_field === 'string' ? item.source_field : null) ?? extractionKey,
        assetRef: typeof item.asset_ref === 'string' ? item.asset_ref : null,
        confidence:
          typeof item.confidence === 'string' || typeof item.confidence === 'number'
            ? item.confidence
            : null,
      }
    })
    .filter((evidence) => evidence.text.length > 0)
}

function normalizeActiveStatus(value: string | null): CuratedPromoActiveStatus {
  if (value === 'active' || value === 'upcoming' || value === 'expired' || value === 'unknown') {
    return value
  }
  return 'unknown'
}

export function mapCuratedPromoDiscoveryRow(row: CuratedPromoDiscoveryRow): CuratedPromoDiscoveryDTO {
  if (!row.promo_id) {
    throw new Error('Curated promo discovery row is missing promo_id')
  }

  const signals = asSignals(row.signals_json)
  const topSignals = asSignals(row.top_signals_json)
  const evidence = asEvidence(row.evidence_json)

  return {
    promoId: row.promo_id,
    promoSlug: row.promo_slug,

    brand: row.brand ?? 'Unknown brand',
    marketSlug: row.market_slug,
    locationLabel: row.location_label,

    title: row.title ?? 'Untitled promo',
    subtitle: row.subtitle,

    sourceKind: row.source_kind,
    sourceUrl: row.source_url,
    primaryAssetUrl: row.primary_asset_url,

    activeStatus: normalizeActiveStatus(row.active_status),

    visibleStartDate: row.visible_start_date,
    visibleEndDate: row.visible_end_date,
    observedAt: row.observed_at,

    signalFamilies: asStringArray(row.signal_families),
    signalTypes: asStringArray(row.signal_types),
    gameplayTags: asStringArray(row.gameplay_tags),
    badges: asStringArray(row.badges),

    topSignals: topSignals.length > 0 ? topSignals : signals.slice(0, 3),
    signals,
    evidence,
  }
}
