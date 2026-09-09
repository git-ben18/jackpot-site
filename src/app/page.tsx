import InlineNewsletterHero from "@/components/InlineNewsletterHero";

export default function HomePage() {
  return (
    <>
      <h1>Jackpot Homie</h1>
      <p className="muted">
        Public homepage scaffold. Curated promo discovery remains a later
        mount; newsletter acquisition below is DOI-only against the same-origin
        BFF seam.
      </p>
      <div className="mt-10">
        <InlineNewsletterHero />
      </div>
    </>
  );
}
