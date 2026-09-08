import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { curatedPromoDiscoveryViewRows } from '../__fixtures__/curatedPromoDiscoveryRow.fixtures'
import { mapCuratedPromoDiscoveryRow } from '../mappers/curatedPromoDiscoveryMapper'
import {
  CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
  CURATED_PROMO_DISCOVERY_MAX_LIMIT,
  CURATED_PROMO_DISCOVERY_SCHEMA,
  CURATED_PROMO_DISCOVERY_SELECT,
  CURATED_PROMO_DISCOVERY_VIEW,
  getCuratedPromos,
  resolveCuratedPromoLimit,
} from '../server/curatedPromoRepository'
import { resolvePublicSupabaseConfig } from '../server/publicSupabase'

function createThenableQueryBuilder(result: { data: unknown; error: { message: string } | null }) {
  const calls: {
    schema?: string
    from?: string
    select?: string
    limit?: number
    statuses?: string[]
  } = {}

  const builder: Record<string, unknown> = {}
  builder.schema = (schema: string) => {
    calls.schema = schema
    return builder
  }
  builder.from = (relation: string) => {
    calls.from = relation
    return builder
  }
  builder.select = (columns: string) => {
    calls.select = columns
    return builder
  }
  builder.order = () => builder
  builder.limit = (n: number) => {
    calls.limit = n
    return builder
  }
  builder.in = (_column: string, statuses: string[]) => {
    calls.statuses = statuses
    return builder
  }
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)

  return { builder, calls }
}

describe('resolvePublicSupabaseConfig', () => {
  it('fails closed when URL or key is missing', () => {
    const result = resolvePublicSupabaseConfig({})
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.reason, 'missing_config')
  })

  it('prefers SUPABASE_PUBLISHABLE_KEY and never requires service-role', () => {
    const result = resolvePublicSupabaseConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      SUPABASE_SERVICE_ROLE_KEY: 'should-be-ignored',
    })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.key, 'publishable-key')
    }
  })

  it('allows SUPABASE_ANON_KEY as explicit compatibility fallback', () => {
    const result = resolvePublicSupabaseConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
    })
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.key, 'anon-key')
  })
})

describe('curatedPromoRepository contract constants', () => {
  it('uses api schema, approved view, and explicit 21-column allowlist', () => {
    assert.equal(CURATED_PROMO_DISCOVERY_SCHEMA, 'api')
    assert.equal(CURATED_PROMO_DISCOVERY_VIEW, 'v_curated_promo_discovery')
    assert.equal(CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT, 50)
    assert.equal(CURATED_PROMO_DISCOVERY_MAX_LIMIT, 100)
    assert.equal(resolveCuratedPromoLimit(undefined), 50)
    assert.equal(resolveCuratedPromoLimit(0), 1)
    assert.equal(resolveCuratedPromoLimit(999), 100)

    const columns = CURATED_PROMO_DISCOVERY_SELECT.split(', ')
    assert.equal(columns.length, 21)
    assert.ok(!CURATED_PROMO_DISCOVERY_SELECT.includes('*'))
    assert.ok(!columns.includes('observation_id'))
    assert.ok(!columns.includes('import_run_id'))
  })
})

describe('getCuratedPromos', () => {
  it('returns structured missing_config failure without inventing credentials', async () => {
    const result = await getCuratedPromos(
      { limit: 10 },
      {
        isMockEnabled: () => false,
        getClient: () => ({
          ok: false,
          reason: 'missing_config',
          message: 'Missing SUPABASE_URL',
        }),
        logError: () => {},
      },
    )

    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'missing_config')
      assert.deepEqual(result.promos, [])
    }
  })

  it('queries api.v_curated_promo_discovery and maps through curatedPromoDiscoveryMapper', async () => {
    const { builder, calls } = createThenableQueryBuilder({
      data: [curatedPromoDiscoveryViewRows[0]],
      error: null,
    })

    const result = await getCuratedPromos(
      { activeOnly: true, limit: 7 },
      {
        isMockEnabled: () => false,
        getClient: () => builder as never,
        logError: () => {},
      },
    )

    assert.equal(calls.schema, CURATED_PROMO_DISCOVERY_SCHEMA)
    assert.equal(calls.from, CURATED_PROMO_DISCOVERY_VIEW)
    assert.equal(calls.select, CURATED_PROMO_DISCOVERY_SELECT)
    assert.equal(calls.limit, 7)
    assert.deepEqual(calls.statuses, ['active', 'unknown'])
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.source, 'live')
      assert.equal(result.promos.length, 1)
      assert.deepEqual(
        result.promos[0],
        mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0]),
      )
      assert.equal('eventOverlaps' in result.promos[0], false)
    }
  })

  it('uses opt-in mock path only when explicitly enabled', async () => {
    const mockPromo = mapCuratedPromoDiscoveryRow(curatedPromoDiscoveryViewRows[0])
    let liveCalled = false

    const result = await getCuratedPromos(
      { limit: 1 },
      {
        isMockEnabled: () => true,
        loadMockPromos: () => [mockPromo],
        getClient: () => {
          liveCalled = true
          return {
            ok: false,
            reason: 'missing_config',
            message: 'should not be called',
          }
        },
      },
    )

    assert.equal(liveCalled, false)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.source, 'mock')
      assert.equal(result.promos.length, 1)
    }
  })

  it('does not fall back to fixtures when a live query fails', async () => {
    const { builder } = createThenableQueryBuilder({
      data: null,
      error: { message: 'boom' },
    })

    const result = await getCuratedPromos(
      {},
      {
        isMockEnabled: () => false,
        getClient: () => builder as never,
        logError: () => {},
      },
    )

    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'query_failed')
      assert.deepEqual(result.promos, [])
    }
  })
})

describe('curatedPromoRepository source guardrails', () => {
  const repoSource = readFileSync(
    path.join(process.cwd(), 'src/lib/server/curatedPromoRepository.ts'),
    'utf8',
  )
  const clientSource = readFileSync(
    path.join(process.cwd(), 'src/lib/server/publicSupabase.ts'),
    'utf8',
  )

  it('never references service-role or publish producers', () => {
    assert.equal(/process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(repoSource), false)
    assert.equal(/process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(clientSource), false)
    assert.equal(repoSource.includes("schema('publish')"), false)
    assert.equal(repoSource.includes('published_curated_offer'), false)
    assert.equal(repoSource.includes('artifact-queries'), false)
    assert.equal(repoSource.includes('getSupabaseAdminClient'), false)
  })

  it('uses explicit api schema and does not fall back to public view', () => {
    assert.match(repoSource, /CURATED_PROMO_DISCOVERY_SCHEMA = 'api'/)
    assert.match(repoSource, /\.schema\(CURATED_PROMO_DISCOVERY_SCHEMA\)/)
    assert.equal(repoSource.includes("schema('public')"), false)
    assert.equal(repoSource.includes('public.v_curated_promo_discovery'), false)
  })

  it('keeps mock path opt-in via CURATED_PROMO_DISCOVERY_MOCK', () => {
    assert.match(repoSource, /CURATED_PROMO_DISCOVERY_MOCK === '1'/)
  })
})
