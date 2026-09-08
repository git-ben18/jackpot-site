# W3-B status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [W3-B-api-schema-design.md](./W3-B-api-schema-design.md) |
| Result | Complete — `APPROVED FOR W3-C` |
| Evidence | [docs/evidence/db-wave-3/W3-B-api-schema-design-acceptance.md](../../evidence/db-wave-3/W3-B-api-schema-design-acceptance.md) |

## Checklist

- [x] exact API object name approved (`api.v_curated_promo_discovery`)
- [x] exact columns approved (JSE-S3 allowlist only)
- [x] dependency strategy approved (adapted aggregation over `publish` instances + signals)
- [x] compatibility strategy approved (A — retain public view)
- [x] owner/`security_invoker`/RLS model approved (`postgres`, `security_invoker=false`; publish RLS intentionally bypassed; API view = public disclosure boundary)
- [x] privilege matrix approved (`anon` frozen for v1; no new `authenticated` grants)
- [x] PostgREST configuration approved
- [x] rollback approved
- [x] conclusion `APPROVED FOR W3-C`
