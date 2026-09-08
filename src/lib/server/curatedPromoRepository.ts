/**
 * Domain repository for curated promo discovery.
 * REIMPLEMENT (behavior reference only): rewards-maxxing-frontend curatedPromos.ts
 * Physical contract (DB-W3): api.v_curated_promo_discovery — not public.*, not publish.*.
 *
 * Server-only by convention — import from Server Components / route handlers only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import { mapFixtureCuratedPromos } from '../__fixtures__/curatedPromoDiscoveryDto.fixtures'
import {
  mapCuratedPromoDiscoveryRow,
  type CuratedPromoDiscoveryRow,
} from '../mappers/curatedPromoDiscoveryMapper'
import type { CuratedPromoDiscoveryDTO } from '../../types/curatedPromos'
import {
  getPublicSupabaseClient,
  type PublicSupabaseConfigError,
} from './publicSupabase'

export const CURATED_PROMO_DISCOVERY_SCHEMA = 'api'
export const CURATED_PROMO_DISCOVERY_VIEW = 'v_curated_promo_discovery'
export const CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT = 50
export const CURATED_PROMO_DISCOVERY_MAX_LIMIT = 100

/** DB-W3 / JSE-S3 21-column allowlist — never select('*'). */
export const CURATED_PROMO_DISCOVERY_SELECT = [
  'promo_id',
  'promo_slug',
  'brand',
  'market_slug',
  'location_label',
  'title',
  'subtitle',
  'source_kind',
  'source_url',
  'primary_asset_url',
  'active_status',
  'visible_start_date',
  'visible_end_date',
  'observed_at',
  'signal_families',
  'signal_types',
  'gameplay_tags',
  'badges',
  'top_signals_json',
  'signals_json',
  'evidence_json',
].join(', ')

const ACTIVE_ONLY_STATUSES = ['active', 'unknown'] as const

export type GetCuratedPromosParams = {
  /** Redundant UX filter; DB view already restricts to active|unknown. */
  activeOnly?: boolean
  limit?: number
}

export type GetCuratedPromosSuccess = {
  ok: true
  promos: CuratedPromoDiscoveryDTO[]
  source: 'live' | 'mock'
}

export type GetCuratedPromosFailure = {
  ok: false
  reason: 'missing_config' | 'query_failed'
  message: string
  promos: []
}

export type GetCuratedPromosResult = GetCuratedPromosSuccess | GetCuratedPromosFailure

export type CuratedPromoRepositoryDeps = {
  getClient?: () => SupabaseClient | PublicSupabaseConfigError
  isMockEnabled?: () => boolean
  loadMockPromos?: (limit: number) => CuratedPromoDiscoveryDTO[]
  logError?: (message: string, detail?: unknown) => void
}

export function resolveCuratedPromoLimit(limit?: number): number {
  if (limit == null || Number.isNaN(limit)) {
    return CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT
  }
  return Math.max(1, Math.min(CURATED_PROMO_DISCOVERY_MAX_LIMIT, Math.floor(limit)))
}

function defaultIsMockEnabled(): boolean {
  return process.env.CURATED_PROMO_DISCOVERY_MOCK === '1'
}

function defaultLoadMockPromos(limit: number): CuratedPromoDiscoveryDTO[] {
  return mapFixtureCuratedPromos().slice(0, limit)
}

function defaultLogError(message: string, detail?: unknown): void {
  console.error(`[curatedPromoRepository] ${message}`, detail ?? '')
}

function mapRowsSafely(
  rows: CuratedPromoDiscoveryRow[],
  logError: (message: string, detail?: unknown) => void,
): CuratedPromoDiscoveryDTO[] {
  const mapped: CuratedPromoDiscoveryDTO[] = []
  for (const row of rows) {
    try {
      mapped.push(mapCuratedPromoDiscoveryRow(row))
    } catch (mapperError) {
      logError('mapCuratedPromoDiscoveryRow failed', mapperError)
    }
  }
  return mapped
}

/**
 * Fetch curated promos for public discovery.
 * Opt-in mock: CURATED_PROMO_DISCOVERY_MOCK=1 (never a silent production fallback).
 * Does not attach event overlaps. Does not use service-role.
 */
export async function getCuratedPromos(
  params?: GetCuratedPromosParams,
  deps: CuratedPromoRepositoryDeps = {},
): Promise<GetCuratedPromosResult> {
  const activeOnly = params?.activeOnly ?? true
  const limit = resolveCuratedPromoLimit(params?.limit)
  const isMockEnabled = deps.isMockEnabled ?? defaultIsMockEnabled
  const loadMockPromos = deps.loadMockPromos ?? defaultLoadMockPromos
  const logError = deps.logError ?? defaultLogError
  const getClient = deps.getClient ?? getPublicSupabaseClient

  if (isMockEnabled()) {
    return { ok: true, promos: loadMockPromos(limit), source: 'mock' }
  }

  const clientOrError = getClient()
  if ('ok' in clientOrError && clientOrError.ok === false) {
    logError(clientOrError.message)
    return {
      ok: false,
      reason: 'missing_config',
      message: clientOrError.message,
      promos: [],
    }
  }

  const client = clientOrError as SupabaseClient

  try {
    let query = client
      .schema(CURATED_PROMO_DISCOVERY_SCHEMA)
      .from(CURATED_PROMO_DISCOVERY_VIEW)
      .select(CURATED_PROMO_DISCOVERY_SELECT)
      .order('observed_at', { ascending: false })
      .limit(limit)

    if (activeOnly) {
      query = query.in('active_status', [...ACTIVE_ONLY_STATUSES])
    }

    const { data, error } = await query

    if (error) {
      logError('getCuratedPromos query failed', error.message)
      return {
        ok: false,
        reason: 'query_failed',
        message: error.message,
        promos: [],
      }
    }

    const promos = mapRowsSafely(
      (data ?? []) as unknown as CuratedPromoDiscoveryRow[],
      logError,
    )
    return { ok: true, promos, source: 'live' }
  } catch (thrown) {
    logError('getCuratedPromos threw', thrown)
    return {
      ok: false,
      reason: 'query_failed',
      message: thrown instanceof Error ? thrown.message : 'unknown query error',
      promos: [],
    }
  }
}
