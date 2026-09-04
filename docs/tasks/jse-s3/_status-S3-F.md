# S3-F status

| Field | Value |
|---|---|
| Date | 2026-09-04 |
| Packet | [S3-F-db-privilege-acceptance.md](./S3-F-db-privilege-acceptance.md) |
| Result | **`blocked`** |
| Evidence | [docs/evidence/jse-s3-db-privilege.md](../../evidence/jse-s3-db-privilege.md) |

## Frozen preference

**D-S3-11** — invoker + private producers. Recorded in [docs/JSE-S3-CURATED-DISCOVERY-PLAN.md](../../JSE-S3-CURATED-DISCOVERY-PLAN.md). S3-F will not accept a definer view over `public` producers.

## What was done

- Planning + task packets updated for D-S3-11 (S3-F, S3-F-RLS, 00-README, SOURCE_BOUNDARY, AGENTS.md).
- Definition inventory of the authorized Epic A view/table proposal.
- Suggested migration and probe SQL written as handoff (not applied).
- S3-E identity class recorded: publishable/anon → Postgres `anon`.

## What was not done

- Live SELECT / mutation / PostgREST probes (no approved env in this workspace).
- Any Supabase DDL from `jackpot-site`.
- Homepage mount of `getCuratedPromos`.

## Next

1. Migration authority names itself and reviews [docs/evidence/jse-s3-f-rls-suggested-migration.sql](../../evidence/jse-s3-f-rls-suggested-migration.sql) ([S3-F-RLS](./S3-F-RLS-public-read-remediation.md)).
2. After apply, re-run [docs/evidence/jse-s3-db-privilege-probe.sql](../../evidence/jse-s3-db-privilege-probe.sql) plus Data API checks in an approved environment.
3. Only then may S3-F conclude `accepted`. S3-G stays closed.
