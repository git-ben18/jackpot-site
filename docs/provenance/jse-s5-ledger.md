# JSE-S5 provenance ledger

| Field | Value |
|---|---|
| Source repository | `git-ben18/rewards-maxxing-frontend` |
| Functional source baseline | `466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline | `0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |
| S5 start (`jackpot-site` main) | `45e9029ee987677354726671d77fd1a755e009f1` |
| Governing freeze | [`_status-S5-A.md`](../tasks/jse-s5/_status-S5-A.md) |

## S5-B — public shell allowlist

| Target path | Source path | Source SHA | JSE-003 disposition | Target disposition | Hardening / notes | Tests | Excluded |
|---|---|---|---|---|---|---|---|
| `src/app/layout.tsx` | `src/app/layout.tsx` (not copied) | n/a | REIMPLEMENT | REIMPLEMENT | Allowlisted metadata + `PublicShell`; no source providers | `public-shell-allowlist.test.ts` | SessionInit, ExploreFAB, CookieBanner, trackers |
| `src/components/shell/PublicShell.tsx` | none | n/a | REIMPLEMENT (Navbar/Footer responsibilities) | implemented | Narrow frame; CSS-free for tests | same | global data fetch / BFF / curated repo |
| `src/components/shell/SiteHeader.tsx` | `Navbar.tsx` (not copied) | n/a | REIMPLEMENT | REIMPLEMENT | Brand `/` + Privacy only | same | `/newsletter/confirm`, dead routes |
| `src/components/shell/SiteFooter.tsx` | `Footer.tsx` (not copied) | n/a | REIMPLEMENT | REIMPLEMENT | Privacy legal link; homepage-only DOI (no form); no construction copy | same | AcquisitionSignup, EmailSignupForm |
| `src/components/shell/ConsentMountSeam.tsx` | CookieBanner (not copied) | n/a | REIMPLEMENT if retained | empty seam only | Hidden empty mount; no banner (S5-D) | same | cookie_consent, decorative banner |
| `src/lib/shell/shell-allowlist.ts` | none | n/a | n/a | implemented | Frozen nav/legal/forbidden hrefs + metadata | same | — |

## S5-D — consent enforcement

| Target path | Source path | Source SHA | Disposition | Target disposition | Notes | Tests | Excluded |
|---|---|---|---|---|---|---|---|
| `src/lib/consent/analytics-consent.ts` | none (S5-A freeze) | n/a | REIMPLEMENT | implemented | Vocabulary + sink + blocked persistence | `analytics-consent.test.ts` | source CookieBanner / cookie_consent |
| `src/lib/consent/analytics-consent-controller.ts` | none | n/a | implemented | in-memory only | No cookie write; fail-closed hydrate | same | session_id, email_signup |
| `src/lib/consent/optional-analytics-transport.ts` | useTracker EXCLUDE | n/a | REIMPLEMENT seam | generic consent-gated emitter | `createConsentGatedEmitter<TEvent>`; no event/payload schema | same | pre-consent queue, GTM, taxonomy |

## S5-E — first-release telemetry contract

| Target path | Source path | Source SHA | Disposition | Target disposition | Notes | Tests | Excluded |
|---|---|---|---|---|---|---|---|
| `docs/tasks/jse-s5/s5-telemetry-contract.md` | none (S5-A candidates) | n/a | REIMPLEMENT | implemented | Seven events; triggers; allowlists; requested≠confirmed | `first-release-telemetry-contract.test.ts` | provider, DB schema, legacy session/click logs |
| `src/lib/telemetry/first-release-telemetry-contract.ts` | none | n/a | implemented | machine contract | Closed names; payload keys; emit predicates; sink omit identity | same | network transport, GTM, useTracker |
| `docs/tasks/jse-s5/_status-S5-E.md` | n/a | n/a | evidence | accepted | Contract-only; DB-W4 handoff facts | same | tables/RPCs/RLS |
