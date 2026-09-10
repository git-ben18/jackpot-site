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
      <p className="muted">
        Public acquisition enablement remains a Hosted Acceptance / release gate.
        This page exercises the local DOI signup UI against the same-origin BFF
        and curated discovery against the published API contract.
      </p>
      <div className="mt-8">
        <CuratedPromoLandingSection />
      </div>
    </>
  )
}
