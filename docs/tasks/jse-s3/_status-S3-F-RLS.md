# S3-F-RLS status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [S3-F-RLS-public-read-remediation.md](./S3-F-RLS-public-read-remediation.md) |
| Result | **N/A — original S3-F blocker resolved through DB-W3** |
| Unblocks | S3-F may conclude `accepted` without an S3-F-RLS migration |

## Disposition

```text
S3-F-RLS
N/A — original S3-F blocker resolved through DB-W3
```

## Explanation

S3-F-RLS was opened because the original public view could not
simultaneously preserve publish isolation and serve anon under
`security_invoker=true`.

DB-W3 superseded that physical contract with
`api.v_curated_promo_discovery` and independently proved the required
D-S3-06 matrix.

No additional S3-F-RLS migration is required.

## Historical note

This packet remains historically important: it documents the remediation
path that would apply if S3-F found a database-layer failure on the
**current** public-read contract. Its original remediation target
(`public.v_curated_promo_discovery`) is no longer the architecture.

Current accepted contract: see [`_status-S3-F.md`](./_status-S3-F.md) and
[docs/evidence/jse-s3-db-privilege.md](../../evidence/jse-s3-db-privilege.md).

## Checklist

- [x] Migration authority path not required for this disposition
- [x] Original gap explained (invoker-mode public view vs publish isolation)
- [x] Superseding architecture named (`api.v_curated_promo_discovery` via DB-W3)
- [x] D-S3-06 matrix already proven by DB-W3-D
- [x] No producer-table SELECT granted for convenience
- [x] No service-role workaround in `jackpot-site`
- [x] Conclusion `N/A` recorded
- [x] S3-F free to conclude `accepted`
