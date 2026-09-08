# W3-C status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [W3-C-migration-and-privileges.md](./W3-C-migration-and-privileges.md) |
| Result | **APPLIED AND VERIFIED** — core migration-history reconciliation required |
| Evidence | [docs/evidence/db-wave-3/W3-C-migration-apply.md](../../evidence/db-wave-3/W3-C-migration-apply.md) |

## Checklist

- [x] `api` schema created (owner `postgres`)
- [x] `api.v_curated_promo_discovery` created (21 columns; row predicate; owner-rights + `security_barrier`)
- [x] `anon` USAGE + SELECT only; no authenticated api grants
- [x] `publish` remains denied to `anon`
- [x] public compatibility view retained and tightened
- [x] PostgREST / Data API expose `api`
- [x] live apply verified (operator SQL Editor)
- [ ] convergent migration recorded in `git-ben18/core` (follow-up)
