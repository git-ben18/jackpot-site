import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { mapFixtureCuratedPromos } from '../__fixtures__/curatedPromoDiscoveryDto.fixtures'
import { CURATED_PROMO_LANDING_REVALIDATE_SECONDS } from '../server/curatedPromoLandingCache'
import { CuratedPromoLandingSectionView } from '../../components/v2/curated-promos/CuratedPromoLandingSectionView'

const fixturePromos = mapFixtureCuratedPromos()
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const landingPath = 'components/v2/curated-promos/CuratedPromoLandingSection.tsx'
const landingViewPath = 'components/v2/curated-promos/CuratedPromoLandingSectionView.tsx'
const pagePath = 'app/page.tsx'

const forbidden = [
  'fetchCuratedPromoDiscoveryItems',
  'lib/server/curatedPromos',
  'useTracker',
  'log-interaction',
  'log-click',
  'curated-offer-event-overlap',
  'event-display',
  'artifact-queries',
  'supabase-server',
  'SUPABASE_SERVICE_ROLE',
  'LandingDashboardClient',
  'HottestOffersCard',
  'isSupabaseConfigured',
  'InlineNewsletterHero',
]

describe('S3-G curated landing section', () => {
  it('exports a bounded revalidate window', () => {
    assert.equal(CURATED_PROMO_LANDING_REVALIDATE_SECONDS, 300)
  })

  it('renders live success path from fixture DTOs', () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoLandingSectionView, {
        result: { ok: true, promos: fixturePromos, source: 'live' },
      }),
    )
    assert.match(html, /Promos we(?:'|&#x27;|&apos;)re tracking now/)
    assert.match(html, /curated-promos-landing-heading/)
    assert.match(html, /Spring free play bundle/)
    assert.doesNotMatch(html, /temporarily unavailable/i)
  })

  it('renders visitor-safe error without treating failure as empty publish', () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoLandingSectionView, {
        result: {
          ok: false,
          reason: 'query_failed',
          message: 'Curated promo discovery is temporarily unavailable.',
          promos: [],
        },
      }),
    )
    assert.match(html, /temporarily unavailable/i)
    assert.doesNotMatch(html, /No curated promos published yet/i)
  })

  it('renders empty publish via widget empty copy when ok with zero rows', () => {
    const html = renderToStaticMarkup(
      createElement(CuratedPromoLandingSectionView, {
        result: { ok: true, promos: [], source: 'live' },
      }),
    )
    assert.match(html, /No curated promos published yet/i)
  })

  it('keeps LandingSection and homepage free of excluded source couplings', () => {
    for (const relative of [landingPath, landingViewPath, pagePath]) {
      const source = readFileSync(join(srcRoot, relative), 'utf8')
      for (const token of forbidden) {
        assert.equal(
          source.includes(token),
          false,
          `${relative} must not contain ${token}`,
        )
      }
    }

    const landing = readFileSync(join(srcRoot, landingPath), 'utf8')
    assert.match(landing, /getCuratedPromos/)
    assert.match(landing, /unstable_cache/)
    assert.doesNotMatch(landing, /CURATED_PROMO_DISCOVERY_MOCK/)

    const page = readFileSync(join(srcRoot, pagePath), 'utf8')
    assert.match(page, /CuratedPromoLandingSection/)
    assert.match(page, /export const revalidate = 300/)
  })
})
