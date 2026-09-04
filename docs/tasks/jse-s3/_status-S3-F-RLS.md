# S3-F-RLS status

| Field | Value |
|---|---|
| Date | 2026-09-04 |
| Packet | [S3-F-RLS-public-read-remediation.md](./S3-F-RLS-public-read-remediation.md) |
| Result | **opened** (not `remediated`; not `N/A`) |
| Trigger | S3-F conclusion `blocked` — D-S3-11 not evidenced; authorized view proposal leaves producers in `public` |

## Migration authority

**Not named.** Confirm before applying SQL. Candidates to evaluate (do not guess):

- ADR-0003 `core` where it remains documented acquisition DDL owner
- `jackpot-etl/scripts/migrations/` (owns `curated_web_*` and some artifact RLS — **different** tables)
- Epic A proposal currently living only in `rewards-maxxing-frontend` planning SQL

Do not start a third history. Do not apply the suggestion from `jackpot-site`.

## Suggested change

[docs/evidence/jse-s3-f-rls-suggested-migration.sql](../../evidence/jse-s3-f-rls-suggested-migration.sql)

| Relation | Required after apply |
|---|---|
| `public.v_curated_promo_discovery` | `security_invoker = true`; `GRANT SELECT` to `anon` |
| `published_curated_offer_instances_raw` | schema `curation_private`; RLS; `GRANT SELECT` to `anon` |
| `published_curated_offer_signals_raw` | schema `curation_private`; RLS; `GRANT SELECT` to `anon` |
| `published_curated_offer_day` | move if present; **no** `anon` GRANT |
| `curation_private` | not in Exposed schemas / `PGRST_DB_SCHEMAS` |

## Next

Apply in the named authority → fill `docs/evidence/jse-s3-rls-remediation.md` → re-run S3-F matrix → S3-F `accepted` only if D-S3-06 and D-S3-11 pass.
