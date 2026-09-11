import CuratedPromoLandingSection from '../components/v2/curated-promos/CuratedPromoLandingSection'
import InlineNewsletterHero from '../components/InlineNewsletterHero'

/**
 * Route-level ISR aligned with curated landing cache (300s).
 * Must be a literal for Next segment config — keep in sync with
 * `CURATED_PROMO_LANDING_REVALIDATE_SECONDS`.
 */
export const revalidate = 300

export default function HomePage() {
  return (
    <>
      <InlineNewsletterHero />
      <div className="mt-8">
        <CuratedPromoLandingSection />
      </div>
    </>
  )
}
