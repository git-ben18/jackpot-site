# Jackpot Site Extraction Plan

| Field | Value |
|---|---|
| Contract ID | `JSE-001` (target-side adoption) |
| Revision | `1.1` (invariants unchanged from source) |
| Status | Target-side adoption of the accepted source `JSE-001` contract. This repository is **construction/staging only**. A local or unmerged scaffold does **not** complete `JSE-S2`; that slice is complete only after the scaffold and this file merge to `jackpot-site` `main`. |
| Source repository | `git-ben18/rewards-maxxing-frontend` |
| Functional source baseline | `master@466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline | `master@0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |
| Docs authority baseline | `master@1a369ef04273a528d053f6f51c07cc50d7601ae2` |
| Target repository | `git-ben18/jackpot-site` — **exists**. Docs bootstrap: `main@95b8348e6d8e2c08a6c67957a5cdcc980105afb4`. |
| Product / release authority | `git-ben18/jackpot-news` |
| Cross-repo architecture summary | `git-ben18/jackpot-docs` — cross-repository summaries/navigation only; do not duplicate the JSE file-level extraction matrix there |
| Canonical hosting / identity ADR | `jackpot-news/docs/decisions/ADR-0003-acquisition-runtime-hosting-and-workload-identity.md` |
| Public-site authority transition ADR | `jackpot-news/docs/decisions/ADR-0004-public-site-extraction-and-frontend-authority-transition.md` (merged `jackpot-news` PR #10, 2026-08-30) |
| Verified file-level handoff | source `JSE-003` — `rewards-maxxing-frontend/_docs/planning/JSE-003-SOURCE-EXTRACTION-HANDOFF.md` |
| Historical movement inventory | source `JSE-002` — `rewards-maxxing-frontend/_docs/planning/JACKPOT_SITE_SOURCE_EXTRACTION_INVENTORY.md` |
| Target bootstrap handoff | source `_docs/planning/JACKPOT_SITE_TARGET_BOOTSTRAP_HANDOFF.md` |
| Current homepage inventory | source `_docs/planning/HOMEPAGE_MVP_SPLIT.MD` |
| Last updated | 2026-09-03 |

---

## 1. Purpose

`rewards-maxxing-frontend` is the source application from which a smaller, production-safe public Jackpot Homie website will be extracted.

The target is **not** "this repository with fewer homepage components mounted." The target is a deliberately reconstructed public application with an allowlisted code, route, data, credential, and external-service surface.

```text
rewards-maxxing-frontend
legacy/source application
        |
        | copy only explicitly approved public capabilities
        v
jackpot-site
production public website
```

The source-repository copy of this contract answers:

> **What may be extracted from `rewards-maxxing-frontend`, what must be reimplemented before it enters `jackpot-site`, and what must remain behind?**

This target-side copy answers the complementary question while remaining materially equivalent on architectural invariants:

> **What is permitted to exist in the production public site?**

### Core extraction rule

```text
jackpot-site is built from an allowlist.

Absence from this contract
!= permission to copy a dependency.
```

An agent must not copy a module merely because a migrated component imports it. Transitive dependencies must be classified explicitly.

---

## 2. Document authority and lifecycle

### Authority chain

```text
git-ben18/jackpot-news
product / release / legal / cross-repo architecture
ADR-0003 hosting + workload identity
ADR-0004 public-site extraction and frontend authority transition
        ↓
JSE-001  (source copy + this target-side adoption)
canonical extraction architecture,
security and trust boundary
        ↓
JSE-003
verified source implementation handoff
and file-level disposition authority
        ↓
JSE-002
historical initial movement inventory
```

If `jackpot-news` conflicts with this file, `jackpot-news` wins.

If this file conflicts with `JSE-003` on a **trust, route, credential, or production-boundary** invariant, **this file wins**.

If this file conflicts with `JSE-003` on whether a **specific source file** may be copied, reimplemented, or excluded, **`JSE-003` wins**, provided the result still satisfies this file’s trust cuts. Do not use `JSE-002` as the copy allowlist when `JSE-003` disagrees.

### During extraction

The source-repo file remains the canonical **source extraction architecture and trust-boundary contract** (`JSE-001`). File-level COPY / REIMPLEMENT / EXCLUDE lists live in source `JSE-003`.

This file is the intended target copy:

```text
jackpot-site/docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md
```

It must remain materially equivalent on architectural invariants while tracking target-side implementation progress. It does not relax source `JSE-001` / `JSE-003` trust cuts.

### After production cutover

After `jackpot-site` is accepted as the production public workload:

- the target-repo copy becomes the ongoing public-site boundary record;
- this source-repo copy remains the historical extraction record;
- `rewards-maxxing-frontend` must not regain production-public authority merely because legacy functionality remains here;
- cross-repository summaries belong in `jackpot-docs`, not as a third copy of the file-by-file extraction matrix.

### Higher authorities

If this file conflicts with an accepted product, release, legal, or architecture decision in `jackpot-news`, the `jackpot-news` authority wins.

In particular, ADR 0003 already decides the production topology:

```text
jackpot-site / public frontend      -> Vercel
jackpot-api-newsletter              -> Vercel
Supabase                            -> existing project
Cloudflare                          -> DNS / custom hostname / perimeter
SendGrid                            -> transactional provider + signed webhook
Vercel OIDC                         -> primary site-BFF -> newsletter-API identity
```

This extraction plan must implement that architecture rather than reopen provider selection.

ADR 0004 (merged `jackpot-news` PR #10) names `git-ben18/jackpot-site` as the dedicated target public-site repository and states that production public-site / newsletter-BFF authority transfers only after accepted controlled cutover. Repository creation or a staging deployment does not transfer that authority.

---

## 3. Why extract instead of productionizing this entire repository

The current repository contains useful public UI alongside legacy and broader application responsibilities:

- historical landing dashboard and score surfaces;
- artifact and newsletter-display queries;
- Hottest Offers and event discovery;
- multiple acquisition placements;
- legacy `/api/subscribe` subscriber persistence and access-token behavior;
- analytics/session routes developed for the broader application;
- server-side Supabase helpers that may use service-role credentials;
- dormant components that can become reachable again through future wiring.

The 2026-08-25 homepage split already proved that the intended MVP homepage does not require most of that dependency graph. At source baseline `466bfb0`, `/` is reduced to:

```text
src/app/page.tsx
├── optional Supabase-config banner
├── InlineNewsletterHero
└── CuratedPromoLandingSection
```

The public production repository should preserve that smaller intent at the **repository boundary**, not only at the React mount boundary.

---

## 4. Target public-site responsibility

The intended first production responsibility of `jackpot-site` is limited to:

1. public Jackpot Homie site shell;
2. newsletter acquisition UX;
3. newsletter confirmation UX;
4. same-origin newsletter BFF;
5. curated, source-backed promo discovery;
6. Privacy Policy and required consent/cookie behavior;
7. intentionally retained public acquisition analytics;
8. safe outbound links to promo evidence/source pages.

The first target should look conceptually like:

```text
Browser
  |
  v
jackpot-site
  ├── public pages / shell
  ├── newsletter hero + DOI form
  ├── curated promo discovery
  ├── privacy / cookie controls
  └── same-origin newsletter BFF
          |
          | Vercel OIDC workload identity
          v
     jackpot-api-newsletter
          |
          +--> Supabase subscriber state
          +--> SendGrid confirmation delivery

jackpot-site server-side curated reads
          |
          v
Supabase published/read-safe promo contract
```

The browser must never call `jackpot-api-newsletter` directly.

---

## 5. Extraction disposition vocabulary

Every source dependency is assigned one of these dispositions.

| Disposition | Meaning |
|---|---|
| **COPY** | Behavior and implementation are suitable to migrate with normal import/path cleanup. |
| **COPY + HARDEN** | Core implementation is useful, but target must narrow privilege/configuration or production behavior. |
| **REIMPLEMENT** | Product behavior is needed, but the current implementation carries legacy assumptions or an unsafe contract and must not be copied verbatim. |
| **OPTIONAL** | May be migrated only after a specific production-value decision; not required for the MVP launch path. |
| **EXCLUDE** | Must not enter `jackpot-site` for the initial production site. |
| **REASSESS** | Purpose may remain useful, but implementation/consent/security implications must be resolved before migration. |

---

## 6. Current homepage and root-shell inventory

At the source baseline, root layout still mounts shared chrome across all routes:

```text
src/app/layout.tsx
├── SessionInit
├── CookieBanner
├── ExploreFAB
├── Navbar
├── <main>{children}</main>
└── Footer
```

The homepage mounts only:

```text
src/app/page.tsx
├── InlineNewsletterHero
└── CuratedPromoLandingSection
```

This smaller homepage is the correct extraction starting point, but **root-layout reachability still counts as public dependency reachability**. Components such as `ExploreFAB`, session initialization, footer acquisition behavior, and their transitive routes must therefore be classified before copying the shell.

---

## 7. Source-to-target disposition matrix

### 7.1 Public page and shell

| Source capability | Current source | Disposition | Target rule |
|---|---|---|---|
| Homepage composition | `src/app/page.tsx` | **COPY + HARDEN** | Preserve hero + curated discovery shape; remove development-only Supabase config banner from production UX. |
| Root layout | `src/app/layout.tsx` | **REIMPLEMENT** | Rebuild from an allowlist instead of copying every mounted provider/control. |
| Navbar | `src/components/Navbar.tsx` | **COPY + HARDEN** | Keep only links/routes that actually exist and are production-ready in `jackpot-site`. |
| Footer | `src/components/Footer.tsx` | **REIMPLEMENT** | Simplify; DOI-only if signup remains. Do not carry legacy signup fallback. |
| Cookie banner | current root shell | **COPY + HARDEN** | Migrate only with actual analytics-consent enforcement. Banner presence alone is not acceptance. |
| Explore FAB | current root shell | **EXCLUDE** initially | Not part of first MVP public shell unless product explicitly restores it. |
| Privacy page | `src/app/privacy/page.tsx` | **COPY + HARDEN** | Migrate structure, but production values/legal TODOs must be closed under ACQ-05 before launch. |

### 7.2 Newsletter acquisition and confirmation

| Source capability | Current source | Disposition | Target rule |
|---|---|---|---|
| Newsletter hero | `src/components/InlineNewsletterHero.tsx` | **REIMPLEMENT** | Preserve approved presentation/copy intent, but target must be DOI-only. No legacy writer fallback. |
| DOI form | `src/components/newsletter/DoiNewsletterSignupForm.tsx` | **COPY + HARDEN** | Preserve explicit newsletter consent + 21+ controls; reconcile canonical API contract and abuse controls. |
| Acquisition wrapper | `AcquisitionSignup` where still useful | **REASSESS** | Only migrate if it simplifies DOI-only target placements; no legacy branch. |
| Browser subscribe client | `src/lib/newsletter/subscribe-client.ts` | **COPY + HARDEN** | Same-origin only; update against canonical backend contract. |
| Newsletter BFF subscribe | `src/app/api/newsletter/subscribe/route.ts` | **REIMPLEMENT** | Translate canonical DTO, attach site workload identity, sanitize response, fail closed on missing auth/config. |
| Confirm BFF routes | current `/api/newsletter/confirm*` routes | **REIMPLEMENT** | Same contract/auth requirements as subscribe. |
| Confirmation page | `src/app/newsletter/confirm/**` | **COPY + HARDEN** | Preserve token hygiene and allowed UI outcomes; integrate canonical service statuses. |
| DOI flag | `NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED` | **REASSESS** | May remain as acquisition kill switch, but must not switch target back to legacy subscriber persistence. |
| Legacy signup API | `POST /api/subscribe` | **EXCLUDE** | Must not exist in `jackpot-site`. |
| Legacy `email_signups` write | legacy subscribe path | **EXCLUDE** | No target write or dual-write. |
| Legacy `access_token` / `reward_access_token` | legacy acquisition path | **EXCLUDE** | Must not be minted by public-site newsletter acquisition. |
| `subscriber_email_hash` localStorage behavior | legacy success path | **EXCLUDE** by default | Do not migrate unless separately justified by an approved analytics/product requirement. |
| `email_signup` legacy cookie | legacy success path | **EXCLUDE** | DOI soft-gate state must be explicitly designed instead. |
| Footer/modal/slide-in legacy fallback | multiple components | **EXCLUDE** | Target acquisition placements are DOI-only or absent. |

### 7.3 Curated promo discovery

| Source capability | Current source | Disposition | Target rule |
|---|---|---|---|
| Landing wrapper | `src/components/v2/curated-promos/CuratedPromoLandingSection.tsx` | **COPY + HARDEN** | Keep public-discovery-only responsibility. |
| Discovery widget | `CuratedPromoDiscoveryWidget` | **COPY** | Preserve filter/card/detail behavior subject to dependency audit. |
| Promo card/detail/evidence UI | curated promo component tree | **COPY** | Preserve source-backed detail and outbound source CTA semantics. |
| Curated server fetch | `src/lib/server/curatedPromos.ts` | **COPY + HARDEN** | Public/read-safe Supabase access only; no service-role requirement for ordinary public rendering. |
| Public view | `public.v_curated_promo_discovery` | **COPY CONTRACT** | Approved target data contract. Do not replace with raw/canonical tables. |
| Event overlap view | `public.published_curated_offer_event_overlaps` | **OPTIONAL** | Can remain fail-soft or be omitted from initial target dependency surface. |
| Display helpers | curated display/category helpers | **COPY** | Migrate only dependencies actually used by the public curated UI. |
| Mock mode | `CURATED_PROMO_DISCOVERY_MOCK` | **REASSESS** | Dev/preview only. Must not become production fallback that masks data/config failures silently. |
| Primary asset rendering | DTO field exists but cards do not currently use it | **OUT OF SCOPE** | Do not expand extraction just to add imagery. |

### 7.4 Analytics, sessions, cookies

| Source capability | Current source | Disposition | Target rule |
|---|---|---|---|
| Session initialization | `SessionInit` -> `/api/log-session` | **REASSESS** | Keep only if required for defined GTM measurement and appropriately consent-gated. |
| Interaction tracker | `useTracker` -> `/api/log-interaction` | **REASSESS** | Retain only approved public acquisition/discovery events. Failure must never block UX. |
| Outbound click logging | `/api/log-click` | **REASSESS** | Useful for source-link GTM measurement; consent/privacy and least-privilege storage must be defined. |
| Legacy email-signup logging | `logEmailSignup` | **EXCLUDE/REPLACE** | DOI analytics must distinguish requested from confirmed; do not inherit legacy semantics. |
| Cookie consent persistence | current cookie banner behavior | **COPY + HARDEN** | Analytics must honor the decision; merely storing `cookie_consent` is insufficient. |

### 7.5 Dashboard / legacy application surface

The following are **not** part of the initial `jackpot-site` extraction:

| Source dependency | Disposition |
|---|---|
| `LandingDashboardClient` | **EXCLUDE** |
| `HottestOffersCard` | **EXCLUDE** |
| `EventLandingSection` | **EXCLUDE** |
| `MobileDrawerLayout` | **EXCLUDE** |
| landing snapshots | **EXCLUDE** |
| strength-index dashboard surfaces | **EXCLUDE** |
| brand snapshot history | **EXCLUDE** |
| seasonal affinity widgets/artifacts | **EXCLUDE** |
| newsletter artifact/history fetches | **EXCLUDE** |
| scored-offer artifact display cache | **EXCLUDE** |
| old homepage range/brand query behavior | **EXCLUDE** |
| Explore drawer / dashboard widgets | **EXCLUDE** |
| Sticky signup bar | **EXCLUDE** initially |
| homepage newsletter modal | **EXCLUDE** initially |
| reward/promo feed acquisition remnants | **EXCLUDE** from initial target |

Their continued existence in this source repository is intentional and must not be interpreted as permission to migrate them.

---

## 8. Public route allowlist for the first target

The target repository should begin with the smallest route inventory needed for the accepted MVP.

### Expected browser pages

```text
/
/privacy
/newsletter/confirm
```

Additional framework-required routes may exist, but product routes must be explicitly added to this contract or the target contract before public exposure.

### Expected same-origin BFF routes

```text
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

These browser-facing BFF routes are public to the browser but must call the newsletter backend only from server-side code.

### Explicitly forbidden legacy route

```text
POST /api/subscribe
```

The target must not implement it as a rollback path.

Rollback for the new site is deployment-level rollback / acquisition kill-switch behavior, not restoration of a second canonical subscriber writer inside `jackpot-site`.

---

## 9. Newsletter service trust boundary

ADR 0003 is binding.

Target path:

```text
Browser
  |
  | same-origin
  v
jackpot-site BFF
  |
  | Vercel OIDC workload identity
  v
jackpot-api-newsletter
```

The production newsletter API authorization policy should ultimately trust the **`jackpot-site` production Vercel workload**, not the legacy `rewards-maxxing-frontend` project.

### Required invariant

```text
Browser never receives the workload token.
Browser never calls jackpot-api-newsletter directly.
```

### Protected backend routes

The backend protects subscribe/confirm operations with workload identity. `Origin` remains defense-in-depth only and never substitutes for workload authentication.

The target BFF must fail safely if workload-token acquisition or required server configuration fails.

---

## 10. Supabase access boundary

### Curated public reads

The public site should read only published/read-safe contracts needed for public rendering, beginning with:

```text
public.v_curated_promo_discovery
```

Optional event-overlap data may be added if retained by the target contract.

### Least privilege

Ordinary public promo rendering should not require `SUPABASE_SERVICE_ROLE_KEY` if the published view can be safely exposed through an anon/read-only policy.

The source implementation currently allows a service-role credential in its server helper. That is a migration warning, not target permission.

Target principle:

```text
public website rendering
-> lowest privilege capable of reading approved public contracts
```

### Subscriber state

`jackpot-site` must not become a direct subscriber-state persistence authority.

```text
jackpot-site BFF
-> jackpot-api-newsletter
-> Supabase newsletter state
```

No target server route should reproduce the source legacy `email_signups` writer.

---

## 11. Environment and secret allowlist

The target must use a new, explicit environment inventory rather than copying the source `.env` set wholesale.

### Likely public values

Only values intended for browser disclosure may use `NEXT_PUBLIC_*`, for example a public Supabase URL/anon key or public challenge site key when approved.

### Server-only values

Examples include:

- newsletter API upstream URLs;
- workload-identity configuration as required by Vercel OIDC verification/acquisition;
- any server-only Supabase credential if a narrowly justified target operation still needs one;
- abuse-control verification secrets;
- server-side analytics/storage credentials if retained.

### Forbidden migration pattern

```text
copy all rewards-maxxing-frontend Vercel env vars
-> jackpot-site
```

Every target environment variable must map to an approved target capability.

No secret may be exposed through `NEXT_PUBLIC_*`.

---

## 12. Hosting and environment separation

Hosting provider selection is closed by ADR 0003.

`jackpot-site` will use the existing Vercel operating environment and Cloudflare DNS/custom-hostname authority unless a later accepted ADR changes that decision.

Target environments must distinguish at least:

```text
Preview / development
Staging / acceptance
Production
```

Production newsletter authority must not automatically extend to arbitrary preview deployments.

The final OIDC policy should bind the production newsletter API to the approved target workload claims, including the supported combination of:

- Vercel issuer/team;
- `jackpot-site` project identity;
- environment;
- audience/resource binding when supported by the selected implementation.

---

## 13. Privacy, consent, and abuse-control gates

Extraction is not production acceptance.

Before `jackpot-site` acquisition is enabled:

- production Privacy Policy linkage must be complete;
- required newsletter consent must remain explicit and unchecked by default;
- 21+ attestation must remain explicit and unchecked by default;
- cookie/analytics behavior must actually honor consent decisions;
- honeypot behavior must be retained where approved;
- Turnstile or the accepted temporary abuse-control policy must be implemented server-side;
- newsletter backend resend/cooldown/circuit-breaker controls must be accepted;
- confirmation tokens must not leak through analytics, logs, referrers, or persistent URLs;
- no raw email/token logging should be introduced by migration.

Do not invent legal policy values in this extraction task.

---

## 14. Production analytics minimum

Analytics are supporting infrastructure, not a reason to re-import the legacy application.

Candidate first-release events should be limited to decisions that materially help GTM evaluation, for example:

```text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
```

Exact event names remain subject to the approved analytics packet.

Rules:

- analytics failure never breaks promo discovery or newsletter UX;
- subscribe request is not equivalent to confirmed subscription;
- session identity is optional unless a defined measurement requirement needs it;
- cookie/privacy requirements govern analytics initialization;
- do not migrate unrelated dashboard telemetry merely because the helper is shared.

---

## 15. Proposed extraction phases

These are proposed planning slices, not a replacement for target-repo implementation tasks.

### JSE-S1 — Freeze and verify source inventory

- confirm current source baseline;
- audit transitive imports for the COPY / COPY + HARDEN set;
- identify hidden dependencies on dashboard, legacy signup, service-role access, or analytics routes;
- record any source changes after `466bfb0` that affect the extraction surface.

Exit: extraction inventory is evidence-backed and no migrated component has an unclassified production dependency. **Completed by `JSE-003` (PR #30)** against functional baseline `466bfb0`. Use `JSE-003` for the verified file-level allowlist.

### JSE-S2 — Scaffold target from an allowlist

Once `git-ben18/jackpot-site` exists:

- create a minimal Next.js application;
- recreate only approved route/shell structure;
- copy package dependencies only when demanded by approved migrated modules;
- establish target-side copy of `JSE-001`.

Exit: target builds without dashboard/legacy application dependencies.

**Target progress (2026-09-03):** `jackpot-site` exists (`main@95b8348`). The allowlisted App Router scaffold, initial page/shell routes (`/`, `/privacy`, `/newsletter/confirm`), and this file are the S2 implementation. Treat `JSE-S2` as **complete only after that work merges to `main`**. Same-origin newsletter BFF handlers remain `JSE-S4`. Curated discovery remains `JSE-S3`. No dashboard, Hottest Offers, `LandingDashboardClient`, `/api/subscribe`, or service-role client is part of this scaffold.

**S2 package/config allowlist (until a migrated module demands more):** `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`. Reconstruct `package.json`, `tsconfig.json`, and `next.config.ts`. Do not copy source Tailwind/PostCSS/`@supabase/supabase-js` until S3/S5 need them.

### JSE-S3 — Migrate curated discovery

- migrate curated UI/component tree;
- establish lowest-privilege published-view access;
- decide whether event overlaps remain optional;
- migrate only required tracking hooks.

Exit: curated discovery renders from published/read-safe data and fails safely without high-privilege website credentials.

### JSE-S4 — Migrate DOI UX and BFF

- migrate/reimplement hero and DOI form;
- reconcile canonical newsletter API contract;
- implement site BFF contract sanitization;
- implement workload identity integration;
- exclude `/api/subscribe` and all legacy subscriber persistence.

Exit: target contains one newsletter acquisition path and one canonical downstream subscriber authority.

### JSE-S5 — Public shell, privacy, and analytics

- finish target nav/footer;
- complete Privacy Policy integration;
- enforce cookie/analytics behavior;
- add only approved GTM telemetry;
- keep optional shell elements excluded unless explicitly accepted.

Exit: shell contains no legacy route or analytics dependencies by accident.

### JSE-S6 — Production-safety audit and hosted acceptance

- run dependency/route/env inventory against target;
- verify no service-role secret reaches browser or exists without justified server need;
- verify direct browser access to newsletter backend is absent;
- verify Vercel environment/workload separation;
- perform staging E2E against `jackpot-api-newsletter`;
- preserve acquisition flag/kill switch until release gates close.

Exit: target is eligible for ACQ-06 controlled DOI E2E and production cutover decision.

---

## 16. Source-repository responsibilities during extraction

`rewards-maxxing-frontend` remains useful during the migration as:

- behavioral reference;
- source file inventory;
- dashboard/legacy application home;
- rollback/reference application until the target is accepted;
- provenance source for copied modules.

It must **not** be treated as the production architecture authority for the new site.

### Source changes during extraction

If a source module classified for migration changes after the baseline SHA:

1. inspect the delta;
2. decide whether it belongs in the target;
3. record the new source SHA/revision here or in target implementation evidence;
4. do not silently recopy the entire source directory.

---

## 17. Target repository prohibitions

The first `jackpot-site` implementation must not introduce:

- `/api/subscribe`;
- direct writes to legacy `email_signups`;
- legacy reward/access-token minting;
- `LandingDashboardClient`;
- Hottest Offers dashboard dependencies;
- event-discovery dashboard dependencies;
- newsletter manufacturing/composer logic;
- data-ingestion/canonicalization logic;
- live-send administration;
- raw/canonical Supabase data access merely for convenience;
- blanket copying of source environment variables;
- service-role credentials in browser code;
- arbitrary preview-workload production newsletter authority;
- browser-direct `jackpot-api-newsletter` calls.

An exception requires an explicit architecture/product decision and update to this contract.

---

## 18. Target repository acceptance inventory

Before target cutover, produce an evidence table equivalent to:

| Area | Acceptance evidence |
|---|---|
| Routes | Exact production route list; no legacy `/api/subscribe`. |
| Dependencies | Package/import audit contains no dashboard/manufacturing modules. |
| Newsletter | Canonical BFF contract tests + hosted integration. |
| Workload identity | Unauthorized direct calls rejected; authorized site BFF succeeds. |
| Supabase | Public promo reads use approved least-privilege contract. |
| Secrets | Server/browser env inventory reviewed; no inappropriate public secrets. |
| Privacy | Production policy link/version and contact/operator values complete. |
| Cookies/analytics | Consent behavior tested; token/PII hygiene verified. |
| Abuse controls | Honeypot/Turnstile or approved policy + backend cooldown/circuit breaker proven. |
| Curated promos | Filters/cards/detail/source links work from published data. |
| Failure behavior | Analytics/data/API failures do not crash the public site. |
| Vercel | Preview/staging/prod separated; production workload identity bound correctly. |
| Cloudflare | Production hostname/DNS configured after target acceptance. |
| Rollback | Prior Vercel deployment/acquisition kill-switch procedure recorded. |

---

## 19. Cutover model

The desired authority transition is:

```text
BEFORE CUTOVER
rewards-maxxing-frontend
  -> current public/reference workload

jackpot-site
  -> under construction / staging only

AFTER ACCEPTANCE
jackpot-site
  -> authoritative public production site
  -> authoritative public newsletter BFF workload identity

rewards-maxxing-frontend
  -> legacy/dashboard/reference application
  -> not authorized as production public acquisition workload unless explicitly retained
```

The newsletter API production trust configuration must be updated to reflect the new `jackpot-site` workload at the appropriate ACQ-03/cutover step.

---

## 20. Rollback principle

The target must not copy the legacy subscriber writer simply to provide rollback.

Safe rollback tools are:

- disable newsletter acquisition via an approved kill switch/feature flag;
- roll back the Vercel site deployment;
- revert DNS only under an explicit operational procedure if required;
- keep subscriber authority in `jackpot-api-newsletter` unchanged.

Rollback must not create two canonical subscriber systems.

---

## 21. Open decisions / follow-up analysis

The extraction may proceed without reopening the accepted hosting architecture, but these items still need explicit resolution during implementation:

1. final target-repo creation/baseline SHA — docs bootstrap recorded as `main@95b8348`; record the S2 scaffold SHA after it merges to `main`;
2. exact target package dependency allowlist after import audit;
3. whether `public.published_curated_offer_event_overlaps` remains in the first production dependency set;
4. whether any session identifier is needed for first-release GTM analytics;
5. final retained public analytics events and consent behavior;
6. whether the homepage/footer both contain acquisition forms in the initial site;
7. production Privacy Policy values under ACQ-05;
8. final Turnstile enforcement/failure policy;
9. final Vercel OIDC claims/audience binding supported by the deployed topology;
10. final Cloudflare public hostname/cutover record.

These are implementation/product decisions, not permission to broaden the initial site scope.

---

## 22. Exit criteria for this extraction contract

Source-side criteria remain satisfied. Target-side criteria:

- [x] current homepage source surface is identified;
- [x] source baseline SHA is recorded;
- [x] target public responsibility is bounded;
- [x] COPY / REIMPLEMENT / EXCLUDE rules are defined;
- [x] legacy signup persistence is explicitly excluded;
- [x] dashboard/manufacturing dependencies are explicitly excluded;
- [x] published curated promo data contract is identified;
- [x] newsletter BFF/workload-identity boundary references accepted ADR 0003;
- [x] Supabase least-privilege requirement is explicit;
- [x] production route/environment/secret allowlist principles are explicit;
- [x] proposed migration slices are defined;
- [x] `git-ben18/jackpot-site` exists (`main@95b8348`);
- [ ] this target-side copy of `JSE-001` and the S2 scaffold have merged to `jackpot-site` `main`;
- [ ] S2 scaffold SHA recorded as the runtime bootstrap baseline after that merge;
- [ ] later slices (`JSE-S3`–`JSE-S6`) implemented from this contract.

---

## 23. Agent handoff rules

Before migrating source modules into this repository (`JSE-S3` and later):

1. read `jackpot-news` ADR 0003, ADR 0004, and current P0 acquisition release controls;
2. read this file (`JSE-001` target-side adoption) for architecture and trust boundary;
3. read source `_docs/planning/JSE-003-SOURCE-EXTRACTION-HANDOFF.md` for verified file-level dispositions;
4. treat source `_docs/planning/JACKPOT_SITE_SOURCE_EXTRACTION_INVENTORY.md` (`JSE-002`) as historical;
5. read `docs/architecture/SOURCE_BOUNDARY.md` and `docs/provenance/rewards-maxxing-frontend.md` in this repository;
6. inspect current source `master` and compare migrated source files against baseline `466bfb0`;
7. classify every transitive dependency before copying it;
8. prefer reimplementation at trust boundaries (BFF, legacy signup, root shell) rather than copying legacy behavior;
9. never add an excluded dependency merely to make compilation easier;
10. distinguish **copied**, **adapted/hardened**, **implemented**, **configured**, **deployed**, and **operationally accepted**;
11. produce evidence for route, env, credential, and dependency surfaces before target production acceptance.

The extraction is successful when the target site can satisfy its public product promise without carrying the old application's unrelated privileges and responsibilities.
