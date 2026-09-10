import InlineNewsletterHero from '../components/InlineNewsletterHero'

export default function HomePage() {
  return (
    <>
      <InlineNewsletterHero />
      <p className="muted">
        Public acquisition enablement remains a Hosted Acceptance / release gate.
        This page exercises the local DOI signup UI against the same-origin BFF.
      </p>
    </>
  )
}
