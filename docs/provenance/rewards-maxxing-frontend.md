# Provenance — rewards-maxxing-frontend

## Purpose

Track the source repository and accepted extraction artifacts used to construct `jackpot-site`.

This is provenance, not an independent architecture authority.

## Source repository

`git-ben18/rewards-maxxing-frontend`

### Functional extraction baseline

`466bfb065a9c34010ee0f0de22b419299259fa46`

This is the functional public-homepage baseline used for JSE extraction verification.

### Source authority baseline at bootstrap preparation

`0f75f8b596e9e208b02d54cdf48e2011b5217ff3`

This includes the merged JSE-001/002/003 authority reconciliation (PR #31).

## Governing source documents

- `JSE-001` — `_docs/planning/JACKPOT_SITE_EXTRACTION_PLAN.md`
  - source architecture, trust, route, credential, data-access, and production boundary.
- `JSE-003` — `_docs/planning/JSE-003-SOURCE-EXTRACTION-HANDOFF.md`
  - verified source dependency graph and file-level dispositions, subject to JSE-001.
- `JSE-002` — `_docs/planning/JACKPOT_SITE_SOURCE_EXTRACTION_INVENTORY.md`
  - historical initial movement inventory only where JSE-003 supersedes it.

## Higher authority

`git-ben18/jackpot-news`

Relevant decisions:

- ADR-0003 — Acquisition Runtime Hosting and Workload Identity.
- ADR-0004 — Public Site Extraction and Frontend Authority Transition.
  - merged via `jackpot-news` PR #10 on 2026-08-30;
  - by its own merge condition, this authorizes `jackpot-site` as the target public-site repository while keeping production authority transfer gated on acceptance/cutover.

## Provenance recording rule

For every source-derived runtime artifact adopted here, record at implementation time:

| Field | Required |
|---|---|
| Source path | yes |
| Source commit/SHA | yes |
| JSE-003 disposition | yes |
| Target path | yes |
| Copy vs harden vs reimplement | yes |
| Hardening changes | when applicable |
| Tests/fixtures adopted | when applicable |
| Deferred/excluded dependencies | when applicable |

Do not use this file to pre-claim migration of artifacts that have not actually been adopted.

## JSE-S2 (scaffold) — no source runtime copy

The initial App Router shell is **implemented** in this repository, not copied from source `layout.tsx` / `Navbar.tsx` / `Footer.tsx`.

| Item | Record |
|---|---|
| Source path | none (reimplemented shell; source layout is `REIMPLEMENT` in JSE-003) |
| Source commit/SHA | n/a for runtime files |
| JSE-003 disposition | root layout `REIMPLEMENT`; Navbar not COPY |
| Target path | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/privacy/page.tsx`, `src/app/newsletter/confirm/page.tsx` |
| Copy vs harden vs reimplement | implemented placeholders |
| Deferred/excluded dependencies | no Supabase, Tailwind, dashboard, newsletter BFF, `artifact-queries`, `LandingDashboardClient` |

Target-side `JSE-001` adoption (document, not runtime): `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md`, adopted from source `_docs/planning/JACKPOT_SITE_EXTRACTION_PLAN.md` at `rewards-maxxing-frontend` `95bb9bd` (PR #32 text; invariants from `master@0f75f8b`).

## Initial S3 source artifact families

JSE-003 identifies the source families expected to seed curated-discovery work, including:

- curated promo public types/DTOs;
- curated promo discovery mapper;
- mapper tests and fixtures;
- curated display helpers;
- signal-category/taxonomy helpers;
- curated promo carousel/filter/evidence/signal/empty-state presentation;
- card/detail/discovery components with required hardening.

The exact implementation ledger should be added when those artifacts are actually copied/adapted.

## Explicit non-provenance

The following source surfaces are not implementation inputs merely because they exist in the source application:

- generic admin/service-role Supabase helpers;
- artifact storage/query infrastructure;
- dashboard/manufacturing/query features;
- legacy subscriber persistence;
- legacy `/api/subscribe`;
- reward/access-token behavior;
- full event-discovery UI;
- legacy session/experiment middleware;
- unrelated route trees and package dependencies.
