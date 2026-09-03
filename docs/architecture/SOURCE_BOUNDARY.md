# Source Boundary — rewards-maxxing-frontend → jackpot-site

## Status

Active target implementation boundary. Docs bootstrap is `main@95b8348`. The JSE-S2 Next.js scaffold and target-side `JSE-001` adoption live in this repository and are complete only after they merge to `main`.

## Purpose

This document defines how `jackpot-site` may consume implementation artifacts from `git-ben18/rewards-maxxing-frontend` without importing the legacy application's unrelated privileges, routes, dependencies, or responsibilities.

It is a target-side implementation boundary. It does not supersede upstream authority.

## Authority chain

```text
git-ben18/jackpot-news
product / release / legal / cross-repo architecture
ADR-0003 hosting + workload identity
ADR-0004 public-site authority transition
        ↓
rewards-maxxing-frontend JSE-001
source extraction architecture / security / trust boundary
        ↓
rewards-maxxing-frontend JSE-003
verified source file-level dispositions
        ↓
jackpot-site
target implementation architecture / tasks / evidence
```

`JSE-002` is historical provenance where JSE-003 has superseded its file dispositions.

## Source references

Source repository:

`git-ben18/rewards-maxxing-frontend`

Current source authority baseline at bootstrap preparation:

`master@0f75f8b596e9e208b02d54cdf48e2011b5217ff3`

Functional source baseline:

`master@466bfb065a9c34010ee0f0de22b419299259fa46`

Source architecture/trust contract:

`_docs/planning/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`)

Verified file-level handoff:

`_docs/planning/JSE-003-SOURCE-EXTRACTION-HANDOFF.md` (`JSE-003`)

Historical inventory:

`_docs/planning/JACKPOT_SITE_SOURCE_EXTRACTION_INVENTORY.md` (`JSE-002`)

## What the source repository is

During extraction, `rewards-maxxing-frontend` is:

- a behavioral reference;
- source-file provenance;
- the home of JSE-001 and JSE-003;
- a reference/rollback application until target acceptance;
- the legacy/dashboard application that remains outside the new public-site boundary.

## What the source repository is not

It is not:

- a repository template to clone wholesale;
- a package dependency allowlist by inference;
- an environment-variable template;
- a Supabase privilege template;
- the target production architecture;
- permission to copy a transitive import;
- authority to broaden the accepted public-site scope.

## Decision rule for source artifacts

Use this deterministic rule:

```text
"What architecture/security boundary applies?"
→ JSE-001

"What exact source file/behavior should be
 copy / copy+hardening / reimplemented / optional / excluded?"
→ JSE-003

"What did the initial inventory classify and why?"
→ JSE-002, historical only

"What product/release/legal/hosting/workload identity applies?"
→ jackpot-news accepted decisions / ADRs
```

JSE-003 may be more restrictive than an earlier source plan when necessary to preserve JSE-001. It must not relax a JSE-001 trust, route, credential, data-access, or production-boundary invariant.

If target work requires broadening that boundary, amend the upstream authority first.

## Copy discipline

A source component being approved does not approve every module it imports.

If an adopted module imports an excluded or unclassified path:

1. stop;
2. classify the dependency;
3. remove/reimplement the dependency when required;
4. do not copy it merely to satisfy compilation.

Every source-derived target file should have traceable provenance.

## Initial target responsibility boundary

The initial target may contain:

1. public shell/homepage;
2. curated promo discovery;
3. newsletter acquisition UX;
4. newsletter confirmation UX;
5. same-origin newsletter BFF;
6. privacy/cookie controls;
7. approved acquisition analytics;
8. safe outbound source links.

The initial target must not carry the legacy dashboard, manufacturing, ingestion, broad artifact-reading, or subscriber-authority responsibilities.

## Curated discovery boundary

Approved source artifacts may provide:

- curated promo public DTOs;
- mapper and mapper tests/fixtures;
- display helpers;
- taxonomy;
- presentational curated promo UI;
- behavior reference for filtering, cards, detail, evidence, source links, and fail-soft rendering.

The legacy data-access path is **not** the target design.

Specifically, do not migrate:

- `src/lib/artifact-queries.ts`;
- `getSupabaseAdminClient()` as the public read mechanism;
- service-role fallback for public curated reads;
- source `src/lib/server/curatedPromos.ts` unchanged;
- raw/canonical query paths for convenience;
- artifact storage readers;
- dashboard query infrastructure.

The target must reimplement a narrow, low-privilege public-read boundary.

## Newsletter acquisition boundary

The target owns browser-facing acquisition UX and same-origin BFF routes, not canonical subscriber persistence.

Production direction:

```text
Browser
  ↓ same-origin
jackpot-site
  ↓ authenticated server-to-server
jackpot-api-newsletter
  ↓                         ↘
existing Supabase            SendGrid
```

Never introduce:

- browser-direct newsletter-service calls;
- legacy `/api/subscribe`;
- direct legacy subscriber-table writes;
- reward/access tokens;
- a second canonical subscriber store.

## Authority transition

Before target acceptance:

- `jackpot-site` is construction/staging only;
- repository creation or deployment does not transfer production authority.

After evidence-backed acceptance and controlled cutover:

- `jackpot-site` becomes the authoritative public production site;
- it becomes the authorized public newsletter BFF workload;
- `rewards-maxxing-frontend` becomes legacy/dashboard/reference and loses production acquisition authority unless an explicit later decision says otherwise.

## Change control

If a source file changes after the recorded functional baseline:

1. inspect the delta;
2. decide whether the change belongs in the target;
3. record the exact source revision used;
4. do not silently recopy a directory.

If upstream authority changes, update this target boundary before relying on the new decision.
