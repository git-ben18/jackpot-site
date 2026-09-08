# S3-E status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [S3-E-curated-repository.md](./S3-E-curated-repository.md) |
| Result | Complete — REIMPLEMENT over DB-W3 `api` contract |
| Physical contract | `api.v_curated_promo_discovery` (D-S3-04 refreshed by DB-W3-E) |

## Checklist

- [x] `@supabase/supabase-js` added with justification (first curated read client)
- [x] Domain repository queries only the approved view + columns
- [x] Bounded limit enforced
- [x] Mapper boundary preserved
- [x] No service-role/secret read or fallback
- [x] Missing config fails safely
- [x] Mock path cannot silently mask production failures
- [x] Tests cover query shape / fail-closed behavior
- [x] Homepage not yet switched to live data
- [x] Provenance updated
