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
| `docs/tasks/jse-s5/s5-telemetry-contract.md` | none (S5-A candidates) | n/a | REIMPLEMENT | implemented | Seven events; triggers; typed payloads; filterValue=rendered vocab; requested≠confirmed | `first-release-telemetry-contract.test.ts` | provider, DB schema, legacy session/click logs |
| `src/lib/telemetry/first-release-telemetry-contract.ts` | none | n/a | implemented | machine contract | Closed event→payload TS shapes; vocab membership validators; sink omit identity | same | network transport, GTM, useTracker |
| `docs/tasks/jse-s5/_status-S5-E.md` | n/a | n/a | evidence | accepted | Contract-only; DB-W4 handoff facts | same | tables/RPCs/RLS |

## S5-F — telemetry implementation and guardrails

| Target path | Source path | Source SHA | JSE-003 disposition | Target disposition | Hardening / notes | Tests | Excluded |
|---|---|---|---|---|---|---|---|
| `src/lib/telemetry/first-release-telemetry-emitter.ts` | useTracker / SessionInit (not copied) | n/a | EXCLUDE source trackers | REIMPLEMENT | Typed emitApprovedEvent; runtime validate; no emitter onceKeys | `first-release-telemetry-implementation.test.ts` | GTM, log-* routes, pre-consent cache |
| `src/lib/telemetry/first-release-telemetry-transport.ts` | none | n/a | n/a | implemented | Explicit `disabled` / `noop` / `fake` kinds | same | provider SDK, Supabase telemetry schema |
| `src/lib/telemetry/first-release-telemetry-validate.ts` | none | n/a | n/a | implemented | Closed payload; reject extra/prohibited keys | same | generic metadata bag |
| `src/lib/telemetry/first-release-telemetry-triggers.ts` | none | n/a | n/a | implemented | Filter-click diff; lifecycle `createOnceAttemptTracker` | same | sourceKind as filterKey; process-wide onceKeys |
| `src/components/v2/curated-promos/CuratedPromoEmptyStateTelemetryMount.tsx` | none | n/a | n/a | implemented | Client mount for fail_soft from server landing view | same | visitor message string in payload |
| `src/lib/newsletter/newsletter-subscribe-controller.ts` | adapted | n/a | adapted | requested after `setPhase(accepted)` | v1 `newsletter_landing` only | same | email/hash; click-to-emit |
| `src/lib/newsletter/newsletter-confirm-controller.ts` | adapted | n/a | adapted | confirmed after consume `success` | `already_complete` non-emit | same | confirmation token |
| `src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx` | adapted | n/a | adapted | view/filter/card/empty | Consent imported only via emitter | same | analytics-consent direct import |
| `src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx` | adapted | n/a | adapted | source click `promoId` | href navigation unchanged | same | sourceUrl in payload |
| `src/components/v2/curated-promos/CuratedPromoLandingSectionView.tsx` | adapted | n/a | adapted | fail_soft mount | Server view + client child | same | landing.tsx consent import |
| `docs/tasks/jse-s5/_status-S5-F.md` | n/a | n/a | evidence | accepted-with-provider-activation-deferred | Disabled production sink; BLOCKED-DB-W4 provider only | same | tables/RPCs/RLS |

