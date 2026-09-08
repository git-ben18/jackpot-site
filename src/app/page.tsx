import CuratedPromoLandingSection from "../components/v2/curated-promos/CuratedPromoLandingSection";

/**
 * Route-level ISR aligned with curated landing cache (300s).
 * Must be a literal for Next segment config — keep in sync with
 * `CURATED_PROMO_LANDING_REVALIDATE_SECONDS`.
 */
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <h1>Jackpot Homie</h1>
      <p className="muted">
        Public discovery surface. Newsletter acquisition remains a later slice;
        curated promos below read the published API contract.
      </p>
      <div className="mt-8">
        <CuratedPromoLandingSection />
      </div>
    </>
  );
}
