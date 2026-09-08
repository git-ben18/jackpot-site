# W3-B status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [W3-B-api-schema-design.md](./W3-B-api-schema-design.md) |
| Result | **APPROVED** — `APPROVED FOR W3-C` (W3-C later applied) |
| Evidence | [docs/evidence/db-wave-3/W3-B-api-schema-design-acceptance.md](../../evidence/db-wave-3/W3-B-api-schema-design-acceptance.md) |

## Checklist

- [x] exact API object name approved (`api.v_curated_promo_discovery`)
- [x] exact columns approved (21-column allowlist; `promo_id` text)
- [x] dependency strategy approved (adapted aggregation over `publish` instances + signals)
- [x] compatibility strategy approved (A — retain public view until W3-F)
- [x] owner / `security_invoker` / `security_barrier` / disclosure model approved
- [x] row predicate approved: `active_status IN ('active','unknown')`
- [x] privilege matrix approved (`anon` SELECT only; no authenticated grants)
- [x] PostgREST configuration approved
- [x] rollback approved
- [x] conclusion `APPROVED FOR W3-C`
