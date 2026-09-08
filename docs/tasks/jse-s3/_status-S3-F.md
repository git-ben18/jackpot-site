# S3-F status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [S3-F-db-privilege-acceptance.md](./S3-F-db-privilege-acceptance.md) |
| Result | **ACCEPTED** |
| Evidence | [docs/evidence/jse-s3-db-privilege.md](../../evidence/jse-s3-db-privilege.md) |
| Primary proofs | [DB-W3-D](../../evidence/db-wave-3/W3-D-low-privilege-acceptance.md) + [W3-E](../db-wave-3/_status-W3-E.md) |
| S3-F-RLS | [N/A — resolved through DB-W3](./_status-S3-F-RLS.md) |

## Accepted record

```text
identity:
anon / publishable key class

physical contract:
api.v_curated_promo_discovery

owner:
postgres

security_invoker:
false

security_barrier:
true

row boundary:
active_status IN ('active','unknown')

SELECT api:
PASS

DML api:
DENIED

SELECT publish producers:
DENIED

service_role application path:
ABSENT

conclusion:
ACCEPTED
```

## Checklist

- [x] Evidence doc exists with date/environment/role class
- [x] SELECT success evidenced for approved view/columns (via W3-D)
- [x] Mutation denial evidenced (via W3-D)
- [x] Unrelated internal read denial evidenced (via W3-D)
- [x] Producer-table exposure reviewed (via W3-C/D)
- [x] View owner / security_invoker determination recorded (`postgres` / `false` + `security_barrier=true`)
- [x] Explicit `accepted` conclusion
- [x] S3-F-RLS disposed as `N/A` (DB-W3 superseded original blocker)
- [x] No service-role workaround introduced
- [x] S3-G unblocked (prerequisite `accepted` met)
