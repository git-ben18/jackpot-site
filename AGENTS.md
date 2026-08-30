# Agent Rules — jackpot-site

These rules apply to all implementation work in this repository.

## Authority order

When instructions conflict, use this order:

1. `git-ben18/jackpot-news`
   - product / release / legal / cross-repository architecture;
   - ADR-0003 for hosting and workload identity;
   - ADR-0004 for the `rewards-maxxing-frontend` → `jackpot-site` authority transition.
2. `rewards-maxxing-frontend` JSE-001
   - source extraction architecture, security, trust, route, credential, data-access, and production-boundary invariants.
3. `rewards-maxxing-frontend` JSE-003
   - verified source dependency graph and file-level COPY / COPY+HARDEN / REIMPLEMENT / OPTIONAL / EXCLUDE dispositions, subject to JSE-001.
4. `rewards-maxxing-frontend` JSE-002
   - historical provenance only where JSE-003 has superseded its file dispositions.
5. This repository
   - target implementation details and acceptance evidence, provided they do not relax upstream invariants.

## Mandatory read order before runtime changes

1. `docs/architecture/SOURCE_BOUNDARY.md`
2. `docs/provenance/rewards-maxxing-frontend.md`
3. upstream ADR-0004
4. upstream ADR-0003
5. upstream JSE-001
6. upstream JSE-003

Do not infer permission from source imports.

If a copied/adapted module imports an excluded or unclassified path, stop and classify the dependency before continuing. Do not copy another source module merely to make TypeScript compile.

## Initial public route boundary

The initial target is expected to remain limited to the public acquisition/discovery surface, including:

- `/`
- `/privacy`
- `/newsletter/confirm`
- `POST /api/newsletter/subscribe`
- `POST /api/newsletter/confirm/validate`
- `POST /api/newsletter/confirm`

Additional production routes require explicit classification against the accepted boundary.

## Hard prohibitions

Do not introduce or restore:

- legacy `POST /api/subscribe`;
- direct writes to legacy `email_signups`;
- legacy reward/access-token issuance or persistence;
- browser-direct calls to `jackpot-api-newsletter`;
- generic service-role/admin Supabase access for ordinary public promo rendering;
- `artifact-queries.ts`;
- `supabase-server.ts` from the legacy frontend;
- legacy artifact/newsletter-history readers;
- dashboard/query/manufacturing surfaces;
- `LandingDashboardClient`;
- Hottest Offers dashboard dependencies;
- full event-discovery UI or `event-display.ts`;
- legacy session/experiment middleware merely for shared helper reuse;
- legacy acquisition flag behavior that falls back to `/api/subscribe`;
- production secrets in `NEXT_PUBLIC_*`;
- arbitrary preview workloads with production newsletter mutation authority.

An exception requires an explicit upstream architecture/product decision.

## Curated discovery rule

JSE-S3 must treat source UI/contracts as extraction inputs, not the source data client as the target architecture.

Target curated reads must:

- use an intentionally low-privilege server-side reader;
- query only approved published/read-safe contracts;
- use an explicit selected-column allowlist;
- never fall back to a service-role/admin key;
- expose mapped public DTOs to UI code rather than a generic Supabase client;
- fail safely for visitors while producing useful server-side operational evidence.

## Newsletter rule

The browser calls only same-origin BFF routes in this repository.

The BFF:

- validates and allowlists browser fields;
- translates to the canonical `jackpot-api-newsletter` contract;
- authenticates as the approved frontend workload;
- sanitizes service responses;
- prevents subscriber-enumeration leakage;
- never dual-writes canonical subscriber state;
- never restores the legacy subscriber path as rollback.

ADR-0003 workload-authentication and environment-separation rules remain binding.

## Implementation evidence

Always distinguish:

- copied;
- adapted/hardened;
- implemented;
- configured;
- deployed;
- operationally accepted.

A successful build or preview deployment does not equal production acceptance.

For source-derived files, record:

- source repository;
- source functional baseline;
- exact source path;
- exact source SHA or commit used;
- JSE-003 disposition;
- target path;
- target hardening changes.

## Source baseline

Current source authority baseline at target-bootstrap preparation:

`git-ben18/rewards-maxxing-frontend master@0f75f8b596e9e208b02d54cdf48e2011b5217ff3`

Functional source baseline for extraction:

`466bfb065a9c34010ee0f0de22b419299259fa46`

Do not silently recopy later source changes. Inspect and classify any post-baseline delta first.
