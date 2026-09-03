# Jackpot Site

`git-ben18/jackpot-site` is the dedicated target repository for the public Jackpot Homie website.

## JSE-S2 scaffold

This repository now contains a **minimal Next.js App Router scaffold** for the approved initial public pages:

- `/`
- `/privacy`
- `/newsletter/confirm`

Root layout is a reimplemented allowlisted shell (home + privacy links only). Same-origin newsletter BFF routes, curated discovery, and production privacy/analytics are later slices (`JSE-S4`, `JSE-S3`, `JSE-S5`).

Package allowlist until a migrated module demands more: `next`, `react`, `react-dom`, `typescript`, and the listed `@types/*` packages.

```text
npm install
npm run typecheck
npm run build
```

A successful local build is not production acceptance.

Target-side `JSE-001` adoption: `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md`. JSE-S2 is merged/complete at `main@7abb209f7bafd0da53d08027e5773eff272fa39a`. Curated discovery is `JSE-S3` (`docs/JSE-S3-CURATED-DISCOVERY-PLAN.md`, task packets under `docs/tasks/jse-s3/`).

## Current lifecycle

This repository begins as a **construction/staging target**. Repository creation, local builds, preview deployments, or staging deployments do **not** by themselves transfer production public-site or newsletter-BFF authority.

Production authority transfers only after the evidence-backed acceptance and controlled cutover defined by:

- `git-ben18/jackpot-news/docs/decisions/ADR-0004-public-site-extraction-and-frontend-authority-transition.md`
- `git-ben18/jackpot-news/docs/decisions/ADR-0003-acquisition-runtime-hosting-and-workload-identity.md`
- `git-ben18/rewards-maxxing-frontend/_docs/planning/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`)
- `git-ben18/rewards-maxxing-frontend/_docs/planning/JSE-003-SOURCE-EXTRACTION-HANDOFF.md` (`JSE-003`)

## Initial bounded responsibilities

The initial public site may own:

- public homepage and shell;
- curated promo discovery from approved published/read-safe data contracts;
- newsletter acquisition UX;
- newsletter confirmation UX;
- same-origin newsletter BFF routes;
- required privacy/cookie controls;
- approved acquisition analytics only;
- safe outbound source links.

It does not inherit the broader responsibilities of `rewards-maxxing-frontend`.

## Required reading

Before modifying runtime code:

1. `AGENTS.md`
2. `docs/architecture/SOURCE_BOUNDARY.md`
3. `docs/provenance/rewards-maxxing-frontend.md`
4. the authoritative upstream JSE and `jackpot-news` decisions linked above.

The target is built from an explicit allowlist. A source import is not permission to copy its dependency.
