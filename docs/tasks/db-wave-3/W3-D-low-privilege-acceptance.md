# DB-W3-D — Low-privilege acceptance

| Field | Value |
|---|---|
| Track | DB-W3-D |
| Type | Read-only operational evidence |
| Depends on | W3-C applied |
| Blocks | W3-E |
| Database mutation | **None** |

## Goal

Prove that the new API contract works for the intended low-privilege site identity and that producer/internal boundaries remain closed.

## Required identity

```text
DB-W3 v1 site role = anon
```

Use the `anon` role (publishable-key equivalent) intended for ordinary `jackpot-site` curated rendering.

Do not use service-role to prove the public contract.

Do not record secret values in evidence.

## Required acceptance matrix

### API schema routing

Explicit schema route:

```text
api
```

must be reachable through PostgREST/Data API for the site identity.

### Approved SELECT

```text
SELECT api.v_curated_promo_discovery
approved columns
limit 1 / bounded query
→ PASS
```

Use explicit schema selection, e.g. `Accept-Profile: api` or Supabase-js `.schema('api')`.

### Write denial

Prove the site identity cannot mutate the API contract.

Use safe methods appropriate to the view/role:

```text
INSERT → DENIED
UPDATE → DENIED
DELETE → DENIED
```

Do not mutate real production rows merely to prove denial when catalog privilege evidence or a transaction-safe test can prove the same thing.

### Producer isolation

Prove:

```text
SELECT publish.<representative producer>
→ DENIED
```

and preferably schema access itself is denied.

At minimum include the producer relations used by the API view.

### Unrelated object isolation

Confirm W3 did not newly expose unrelated legacy/internal objects.

Use the W3-A inventory to choose representative checks.

## Contract-shape evidence

Confirm:

- explicit selected columns succeed;
- no unexpected secret/admin/debug fields are required;
- returned row shape is compatible with the JSE-S3 mapper/DTO contract.

## PostgREST evidence

Record non-secret:

- HTTP status;
- PostgreSQL/PostgREST error code for expected denials;
- schema/profile used;
- relation;
- date/environment.

## Conclusion

Only one of:

```text
ACCEPTED
```

or:

```text
BLOCKED
```

If blocked, return to W3-B/C as appropriate. Do not work around a DB privilege failure by introducing service-role into `jackpot-site`.

## Out of scope

- homepage integration;
- public-view retirement;
- UI testing;
- event overlap.

## Acceptance checklist

- [x] explicit `api` routing succeeds
- [x] approved SELECT succeeds
- [x] explicit selected columns validated
- [x] writes denied
- [x] `publish.*` read denied
- [x] unrelated object exposure not introduced
- [x] evidence committed
- [x] conclusion `ACCEPTED`

Status: [_status-W3-D.md](./_status-W3-D.md) · Evidence: [W3-D-low-privilege-acceptance.md](../../evidence/db-wave-3/W3-D-low-privilege-acceptance.md)
