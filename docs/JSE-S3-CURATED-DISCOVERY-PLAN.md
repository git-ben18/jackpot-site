# JSE-S3 — Curated Discovery Planning Decisions

| Field | Value |
|---|---|
| Slice | `JSE-S3` |
| Status | **Planning authority for S3 implementation. Not implementation evidence.** |
| Repository | `git-ben18/jackpot-site` |
| Accepted S2 / target baseline | `main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Source repository | `git-ben18/rewards-maxxing-frontend` |
| Functional source baseline | `466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source architecture authority | `JSE-001` |
| Source file-level disposition authority | `JSE-003` |
| Higher product / release authority | `git-ben18/jackpot-news` |
| Last updated | 2026-09-04 |

---

## 1. Purpose

`JSE-S3` migrates the public curated-promo discovery experience into `jackpot-site` without importing the legacy application's dashboard, event-discovery, analytics, artifact-query, or elevated Supabase access patterns.

S3 is not a bulk copy task. It is a controlled reconstruction of one public vertical slice:

```text
published/read-safe promo data
        ↓
low-privilege server repository
        ↓
explicit selected-column contract
        ↓
mapper
        ↓
public CuratedPromoDiscoveryDTO
        ↓
curated discovery UI
```

The S3 exit remains the JSE-001 requirement:

> Curated discovery renders from published/read-safe data and fails safely without high-privilege website credentials.

---

## 2. Authority and source rules

Use this decision order:

```text
Product / release / cross-repo architecture
→ jackpot-news

Architecture / security / trust boundary
→ JSE-001

Exact source file COPY / COPY+HARDEN / REIMPLEMENT / OPTIONAL / EXCLUDE
→ JSE-003

Historical initial inventory
→ JSE-002 only when useful for provenance

Target implementation sequence and S3-specific decisions
→ this document and later jackpot-site S3 architecture/task docs
```

A source import does not confer permission to migrate its dependency.

If an adopted source file imports an EXCLUDED or unclassified path, stop and classify or remove that dependency before proceeding.

---

## 3. S3 scope

S3 owns:

- curated promo public types / DTOs;
- the curated promo discovery mapper;
- mapper fixtures and tests;
- display and taxonomy helpers required by the public UI;
- curated promo carousel, filters, cards, detail sheet, evidence, signals, and empty state;
- a new target-specific low-privilege curated promo repository;
- server-side integration with `public.v_curated_promo_discovery`;
- deterministic loading / empty / error behavior;
- bounded server-side caching / revalidation;
- S3-specific provenance and acceptance evidence.

S3 does **not** own:

- newsletter signup or confirmation;
- newsletter BFF routes or Vercel OIDC;
- cookie / consent analytics infrastructure;
- legacy interaction/session logging;
- full event discovery;
- dashboard / Hottest Offers / snapshot surfaces;
- raw or canonical data access;
- newsletter manufacturing or administration;
- production cutover.

Those remain later slices or explicitly excluded responsibilities.

---

## 4. Frozen S3 planning decisions

### D-S3-01 — Accepted target baseline

S3 begins from:

`jackpot-site main@7abb209f7bafd0da53d08027e5773eff272fa39a`

This is the merged JSE-S2 scaffold baseline.

All S3 implementation PRs must be attributable to this baseline or to an explicitly recorded descendant.

### D-S3-02 — Event overlaps are deferred from initial S3

The initial S3 production dependency set does **not** include:

- `public.published_curated_offer_event_overlaps`;
- `src/types/curatedOfferEventOverlap.ts`;
- the overlap mapper/display package;
- `src/lib/event-display.ts`;
- `src/types/events.ts`;
- `src/components/v2/events/**`;
- `date-fns` solely for overlap formatting.

Reason:

`CuratedPromoCard` and `CuratedPromoDetailSheet` currently import overlap display code unconditionally, and that path reaches excluded full event-discovery presentation code.

Target rule:

- migrate Card and DetailSheet as **COPY + HARDEN**;
- remove the overlap imports / presentation for initial S3;
- keep `eventOverlaps?` optional in the public DTO if doing so preserves compatibility cleanly;
- adding overlaps later requires a separate explicit target decision and dependency review.

### D-S3-03 — Production analytics are deferred from S3

Curated discovery must function without `useTracker`, `/api/log-interaction`, `/api/log-click`, `SessionInit`, or legacy logging routes.

Target rule:

- `CuratedPromoDiscoveryWidget` is COPY + HARDEN;
- remove or replace tracker calls with an internal no-op seam that has no network side effects;
- Card / DetailSheet source links must continue to work even with no analytics implementation;
- S5 may later add approved consent-aware analytics through a deliberately designed adapter.

Analytics failure must never become a promo discovery failure mode.

### D-S3-04 — Public data contract is `public.v_curated_promo_discovery`

S3 reads only the approved published/read-safe view:

`public.v_curated_promo_discovery`

Do not replace it with:

- raw tables;
- canonical tables;
- artifact storage;
- dashboard query infrastructure;
- broad generic Supabase helpers.

The target repository must preserve an explicit selected-column allowlist rather than `select('*')`.

Initial selected-column contract:

```text
promo_id
promo_slug
brand
market_slug
location_label
title
subtitle
source_kind
source_url
primary_asset_url
active_status
visible_start_date
visible_end_date
observed_at
signal_families
signal_types
gameplay_tags
badges
top_signals_json
signals_json
evidence_json
```

The mapper is the boundary between database-shaped rows and public UI DTOs.

### D-S3-05 — Low-privilege Supabase identity only

Ordinary public curated rendering must not use:

- `SUPABASE_SERVICE_ROLE_KEY`;
- Supabase secret/service-role credentials;
- `getSupabaseAdminClient()`;
- `artifact-queries.ts`;
- a fallback from low privilege to elevated privilege.

Preferred target configuration where the existing Supabase project supports the current key model:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

A legacy anon key may be used only as an explicit compatibility fallback if the project has not yet enabled publishable keys. It must remain low privilege and must never fall back to service-role/secret credentials.

The query remains server-side as an application architecture choice, but security must not depend on hiding a publishable key.

### D-S3-06 — Database privilege behavior must be proven

S3 acceptance must verify actual database behavior for the low-privilege identity.

Required acceptance matrix:

```text
SELECT public.v_curated_promo_discovery
→ succeeds for intended published rows/columns

INSERT / UPDATE / DELETE
→ denied

unrelated internal object reads
→ denied

raw / canonical tables used to produce the view
→ not newly exposed merely for jackpot-site
```

The view's ownership and execution behavior must be audited.

Because PostgreSQL views may execute with creator privileges by default, explicitly determine whether `security_invoker = true` is appropriate and supported for this view. Do not mark S3's public-read boundary accepted until the view/grant/RLS behavior is understood and evidenced.

### D-S3-07 — Domain-specific repository, not generic Supabase access

Preferred target structure:

```text
CuratedPromoLandingSection
        ↓
getCuratedPromos()
        ↓
curatedPromoRepository.ts
        ↓
low-privilege server Supabase client
        ↓
public.v_curated_promo_discovery
        ↓
explicit selected-column allowlist
        ↓
curatedPromoDiscoveryMapper
        ↓
CuratedPromoDiscoveryDTO
```

A small `publicSupabase.ts` helper may exist if useful, but other application code should not receive an unrestricted generic Supabase client merely because S3 needs one public query.

Preferred repository API shape:

```ts
getCuratedPromos({
  activeOnly: true,
  limit: 50,
})
```

Exact names may vary. The narrow responsibility may not.

### D-S3-08 — Prove contracts/UI before live Supabase integration

S3 implementation order must separate two concerns:

1. source artifact extraction and UI behavior;
2. production data-access security and live integration.

The first implementation checkpoint should render the migrated curated UI from deterministic fixtures without requiring Supabase configuration.

Only after the DTO / mapper / presentational graph builds and tests cleanly should live Supabase access be introduced.

A mock/fixture path may exist for tests and explicit development/preview use. It must never silently become a production fallback that masks broken production configuration or data access.

### D-S3-09 — Explicit S3 dependency allowlist

S2 intentionally started with only the minimal Next / React / TypeScript dependency set.

S3 may add packages only when an approved S3 module requires them.

Expected additions:

```text
@supabase/supabase-js   # live public-read repository

# dev only
tsx                     # preserve lightweight node test execution used by source tests
```

Tailwind / PostCSS may be added only if the adopted curated components and approved target styling require them. Reconstruct the minimum required styling configuration rather than copying source configuration wholesale.

Do not add merely because they exist in the source package:

```text
recharts
react-intersection-observer
classnames
react-is
```

`date-fns` is not required for initial S3 while event overlaps are deferred.

### D-S3-10 — Provenance and evidence are part of implementation

Every source-derived runtime artifact adopted in S3 must record:

- source path;
- source commit/SHA;
- JSE-003 disposition;
- target path;
- COPY vs COPY+HARDEN vs REIMPLEMENT;
- hardening changes;
- migrated tests/fixtures;
- deferred/excluded imports.

Do not wait until final closeout to reconstruct this information from memory.

---

## 5. Source artifact disposition for initial S3

### COPY candidates

Subject to verification against the recorded source baseline / JSE-003:

```text
src/components/v2/curated-promos/CuratedPromoCarousel.tsx
src/components/v2/curated-promos/CuratedPromoEmptyState.tsx
src/components/v2/curated-promos/CuratedPromoEvidenceBlock.tsx
src/components/v2/curated-promos/CuratedPromoFilterChips.tsx
src/components/v2/curated-promos/CuratedPromoSignalList.tsx

src/types/curatedPromos.ts
src/lib/mappers/curatedPromoDiscoveryMapper.ts
src/lib/__tests__/curatedPromoDiscoveryMapper.test.ts
src/lib/__fixtures__/curatedPromoDiscoveryRow.fixtures.ts
src/lib/curated-promo-display.ts
src/lib/__tests__/curated-promo-display.test.ts
src/lib/curated-promo-card-display.ts
src/lib/constants/curatedPromoSignalCategory.ts
src/lib/__tests__/curatedPromoSignalCategory.test.ts
```

### COPY + HARDEN candidates

```text
src/components/v2/curated-promos/CuratedPromoLandingSection.tsx
src/components/v2/curated-promos/CuratedPromoDiscoveryWidget.tsx
src/components/v2/curated-promos/CuratedPromoCard.tsx
src/components/v2/curated-promos/CuratedPromoDetailSheet.tsx
src/lib/constants/nicheMap.ts
```

Required hardening includes:

- remove legacy tracker dependencies;
- remove event-overlap dependencies for initial S3;
- point LandingSection at the target repository rather than source `curatedPromos.ts`;
- preserve source/evidence CTA behavior without analytics dependency;
- do not add lineage/raw/debug fields to the public DTO.

### REIMPLEMENT

```text
source src/lib/server/curatedPromos.ts behavior
→ target curatedPromoRepository / public-read implementation
```

### EXCLUDE

S3 must not import or recreate for convenience:

```text
src/lib/server/curatedPromos.ts         # source file itself
src/lib/artifact-queries.ts
src/lib/supabase-server.ts
src/lib/supabase.ts                     # source helper
src/hooks/useTracker.ts
src/lib/event-display.ts
src/types/events.ts
src/lib/event-date-ranges.ts
src/components/v2/events/**
LandingDashboardClient
Hottest Offers / snapshots / dashboard infrastructure
legacy analytics/session routes
```

---

## 6. Strong internal S3 implementation track

The implementation should follow S3-A through S3-H. These are internal target-repo work packets under the higher-level `JSE-S3` slice.

### S3-A — Baseline + decisions

**Goal:** establish the immutable starting point and remove design ambiguity before runtime extraction.

Tasks:

- record `main@7abb209f7bafd0da53d08027e5773eff272fa39a` as S2/S3 starting baseline;
- reconcile target JSE-001 status so S2 is recorded as merged/complete;
- confirm current source revisions for each S3 source artifact;
- record this decision set;
- freeze event overlaps as deferred for initial S3;
- freeze analytics as deferred/no-op for initial S3;
- define initial S3 package additions.

Exit:

- no unresolved architecture question prevents S3-B from copying pure contracts/tests;
- no S3 runtime file has been copied yet unless it is part of an explicitly reviewed S3-A metadata change.

### S3-B — Public contracts / mapper / tests

**Goal:** establish the public curated data contract independently of UI and infrastructure.

Tasks:

- adopt `src/types/curatedPromos.ts`;
- adopt `curatedPromoDiscoveryMapper.ts`;
- adopt mapper fixtures and mapper tests;
- adopt curated display helpers and taxonomy required by the DTO;
- add/adapt lightweight test execution (`tsx --test`) if required;
- preserve the explicit published-view row → public DTO boundary;
- ensure mapper output contains no raw lineage/admin/debug fields.

Exit:

- mapper and helper tests pass in `jackpot-site`;
- no Supabase client is required to run the tests;
- no excluded source dependency enters the target graph.

### S3-C — Leaf presentation

**Goal:** adopt only leaf curated UI that does not compose filters/carousel/card/widget, and exercise it from fixtures before composed hardening.

Tasks:

- adopt EmptyState, EvidenceBlock, SignalList;
- adopt required curated styling for those leaves only;
- mount or exercise the leaves against fixture DTOs;
- do **not** adopt Carousel, FilterChips, Card, DetailSheet, Widget, nicheMap, or LandingSection yet.

Exit:

- leaf presentation renders from fixture DTOs;
- UI behavior can be tested without Supabase or analytics;
- dashboard/event/newsletter dependencies are absent.

### S3-D — Composed / hardened presentation

**Goal:** compose FilterChips / Carousel with hardened Card / DetailSheet / Widget / nicheMap, severing tracker and event-overlap couplings before the tree is treated as target-safe.

Tasks:

- adopt FilterChips and Carousel (COPY);
- adopt nicheMap, Card, DetailSheet, and DiscoveryWidget as COPY + HARDEN;
- remove `useTracker` network behavior;
- remove event-overlap display imports and any transitively excluded event modules;
- preserve outbound source CTA semantics without `/api/log-click` dependency;
- ensure empty/error states remain usable;
- wire the composed tree to S3-C leaves and S3-B fixtures.

Exit:

- no import from excluded tracker/event paths exists;
- the complete curated presentation tree renders from fixtures;
- `next build` / typecheck succeeds with the narrowed dependency graph.

### S3-E — Low-privilege curated repository

**Goal:** implement the target data-access boundary without inheriting source admin behavior.

Tasks:

- add `@supabase/supabase-js` only at this point unless earlier work proves it is required sooner;
- implement target low-privilege server client configuration;
- implement domain-specific `curatedPromoRepository` / equivalent;
- use only `public.v_curated_promo_discovery`;
- preserve explicit selected columns;
- enforce bounded `limit` behavior;
- map rows through `curatedPromoDiscoveryMapper`;
- never fall back to service-role/secret credentials;
- implement safe structured server errors without leaking keys or raw data.

Exit:

- repository tests or controlled integration checks prove its query shape and mapper boundary;
- missing configuration fails safely;
- elevated credentials are neither required nor accepted as fallback.

### S3-F — Database privilege / view acceptance

**Goal:** prove that the public-read boundary is secure at the database layer, not merely in application code.

Tasks:

- verify view grants for the low-privilege identity;
- inspect view owner / security behavior;
- determine and document `security_invoker` applicability;
- verify intended SELECT succeeds;
- verify INSERT / UPDATE / DELETE are denied;
- verify unrelated internal reads are denied;
- verify underlying raw/canonical tables were not broadly exposed for the site;
- record non-secret evidence of these tests;
- if view/grants/`security_invoker`/RLS must change, **stop** with S3-F `blocked` and implement **S3-F-RLS** through the current Supabase migration authority — do not apply ad-hoc production DDL from `jackpot-site`.

Exit:

- actual privilege behavior matches D-S3-06;
- no service-role/secret key is needed for ordinary curated rendering;
- unresolved view-privilege behavior blocks progression to S3-G;
- required database DDL/grant changes are not applied from this repository.

### S3-F-RLS — Public-read RLS / grant remediation

**Goal:** close missing or insufficient RLS, policies, grants, or `security_invoker` on the S3 public-read path in the **migration-authority** repo.

Tasks:

- name the current published-view DDL owner before writing SQL;
- enumerate `public.v_curated_promo_discovery`, its producer relations, and any other object the S3-E low-privilege role can reach;
- enable RLS and add explicit policies (or record why RLS is not the control) on reachable base tables that lack them;
- revoke stray GRANTs; do not grant producer-table SELECT for convenience;
- set/document `security_invoker` when the view-owner audit requires it;
- re-run the D-S3-06 matrix;
- record non-secret evidence; then let S3-F conclude `accepted`.

Exit:

- S3-F-RLS is `remediated`, or `N/A` because S3-F already proved no gap;
- DDL landed only in the named migration authority;
- S3-G remains blocked until S3-F is `accepted`.

A whole-database RLS sweep of tables the site role cannot reach is a migration-repo follow-up, not an S3-G blocker.

### S3-G — Live homepage integration

**Goal:** replace fixture-only proof with the production-shaped published data path while preserving safe visitor behavior.

Tasks:

- connect `CuratedPromoLandingSection` to the target repository;
- mount curated discovery on the approved homepage composition;
- add bounded caching/revalidation aligned with reasonable publish cadence;
- define empty-result behavior;
- define upstream/data error behavior;
- ensure production does not silently switch to mock data;
- verify active-only / limit behavior;
- verify filters/cards/detail/source links against real published rows.

Exit:

- homepage curated discovery renders from `public.v_curated_promo_discovery`;
- safe empty/error states work;
- no high-privilege website credential exists for this path;
- no event/analytics/dashboard dependency has returned through integration.

### S3-H — Evidence + S3 closeout

**Goal:** produce evidence sufficient to call JSE-S3 implemented and accepted at the target-repo level.

Required evidence:

- exact S3 target SHA;
- S2 baseline SHA;
- source artifact provenance ledger;
- COPY / COPY+HARDEN / REIMPLEMENT record;
- package/dependency audit;
- excluded import audit;
- mapper/helper/UI test results;
- build/typecheck results;
- live public-view behavior;
- low-privilege database acceptance matrix;
- confirmation that no service-role/secret fallback exists;
- event-overlap deferral decision;
- analytics deferral/no-op decision;
- cache/revalidation behavior;
- visitor empty/error behavior.

Exit:

- S3 evidence document exists and references actual results, not planned checks;
- JSE-S3 may be marked complete only after the evidence is reviewed/accepted;
- S4 may proceed independently of unresolved S3 enhancements that were explicitly deferred.

---

## 7. Expected implementation sequence

```text
S3-A  Baseline + decisions
  ↓
S3-B  Public contracts / mapper / tests
  ↓
S3-C  Leaf presentation
  ↓
S3-D  Composed / hardened presentation
  ↓
S3-E  Low-privilege curated repository
  ↓
S3-F  Database privilege / view acceptance
  ↓
S3-F-RLS  Public-read RLS / grant remediation (if S3-F is blocked)
  ↓
S3-G  Live homepage integration
  ↓
S3-H  Evidence + S3 closeout
```

Do not collapse S3-E/F into UI extraction merely for speed. The separation exists so source artifact correctness and public-data privilege correctness can be reviewed independently.

### Agent task packets

Sequential, single-packet agent briefs live under:

```text
docs/tasks/jse-s3/00-README.md
docs/tasks/jse-s3/S3-A-baseline-decisions.md
docs/tasks/jse-s3/S3-B-contracts-mapper-tests.md
docs/tasks/jse-s3/S3-C-leaf-presentation.md
docs/tasks/jse-s3/S3-D-composed-hardened-presentation.md
docs/tasks/jse-s3/S3-E-curated-repository.md
docs/tasks/jse-s3/S3-F-db-privilege-acceptance.md
docs/tasks/jse-s3/S3-F-RLS-public-read-remediation.md
docs/tasks/jse-s3/S3-G-live-homepage-integration.md
docs/tasks/jse-s3/S3-H-evidence-closeout.md
```

Hand agents **one packet at a time** in that order. The packets do not replace this planning document; they operationalize S3-A..H.

---

## 8. Recommended PR boundaries

The S3-A through S3-H track does not require exactly eight PRs, but implementation PRs should remain independently reviewable.

A reasonable delivery pattern is:

```text
PR 1 — S3-A planning/baseline
PR 2 — S3-B contracts/tests
PR 3 — S3-C + S3-D leaf then composed/hardened presentation
PR 4 — S3-E repository implementation
PR 5 — S3-F privilege evidence; S3-F-RLS in the migration-authority repo if blocked; then S3-G live integration
PR 6 — S3-H closeout evidence
```

If a PR mixes unrelated S3 responsibilities, split it unless there is a strong implementation reason not to.

---

## 9. S3 stop conditions

Stop implementation and resolve the boundary before continuing if any of the following occurs:

- an approved component requires an EXCLUDED source import to compile;
- public promo rendering appears to require a secret/service-role credential;
- the published view exposes more data than the approved column/public DTO contract;
- the low-privilege role can modify published data;
- unrelated internal tables become readable as a side effect of S3 grants;
- event-discovery code is required after overlaps were deferred;
- analytics becomes required for basic discovery UX;
- production data failure can only be hidden by silently serving mock data;
- a new package is proposed only because it existed in the source repository;
- `jackpot-site` is asked to apply ad-hoc Supabase schema/grant/RLS/`security_invoker` DDL instead of routing through the migration authority.

Resolve or amend the relevant architecture decision rather than broadening S3 implicitly.

---

## 10. Relationship to later slices

S3 deliberately leaves these responsibilities for later work:

```text
JSE-S4
newsletter DOI UX + same-origin BFF + workload identity

JSE-S5
public shell completion + privacy + cookie/consent analytics

JSE-S6
route/env/credential audit + hosted acceptance + staging E2E
```

S3 must not pre-implement S4/S5 infrastructure to make its own migration easier.

---

## 11. S3 planning exit

This planning document is ready to hand to implementation agents when:

- [x] S2 target baseline is known;
- [x] curated published data contract is bounded;
- [x] event-overlap first-release decision is made;
- [x] analytics first-release decision is made;
- [x] public-read credential principle is fixed;
- [x] database privilege acceptance behavior is defined;
- [x] source COPY / HARDEN / REIMPLEMENT cuts are recorded;
- [x] S3 dependency-addition rules are defined;
- [x] fixture-first implementation order is defined;
- [x] S3-A through S3-H exits are defined (including S3-F-RLS when privilege gaps exist);
- [x] sequential agent task packets exist under `docs/tasks/jse-s3/`;
- [x] implementation has started (S3-A docs/metadata);
- [ ] S3 acceptance evidence exists.

S3 acceptance evidence remains unchecked until S3-H.
