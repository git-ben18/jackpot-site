/**
 * COPY + HARDEN from rewards-maxxing-frontend CuratedPromoLandingSection.tsx
 * Hardening: target getCuratedPromos (api view); fail-soft without mock fallback;
 * no tracker/overlaps; remap unavailable brand Tailwind tokens to standard utilities.
 */
import { unstable_cache } from 'next/cache'

import { CURATED_PROMO_LANDING_REVALIDATE_SECONDS } from '../../../lib/server/curatedPromoLandingCache'
import {
  CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
  getCuratedPromos,
} from '../../../lib/server/curatedPromoRepository'
import { CuratedPromoLandingSectionView } from './CuratedPromoLandingSectionView'

const getCachedCuratedPromosForLanding = unstable_cache(
  async () =>
    getCuratedPromos({
      activeOnly: true,
      limit: CURATED_PROMO_DISCOVERY_DEFAULT_LIMIT,
    }),
  ['curated-promo-discovery-landing'],
  { revalidate: CURATED_PROMO_LANDING_REVALIDATE_SECONDS },
)

export default async function CuratedPromoLandingSection() {
  const result = await getCachedCuratedPromosForLanding()
  return <CuratedPromoLandingSectionView result={result} />
}
