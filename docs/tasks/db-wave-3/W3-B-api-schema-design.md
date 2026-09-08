# DB-W3-B — API schema and view design

| Field | Value |
|---|---|
| Track | DB-W3-B |
| Type | Architecture/design |
| Depends on | W3-A `READY FOR W3-B` |
| Blocks | W3-C |
| Database mutation | **None** |

## Goal

Approve the exact target contract and security behavior before SQL is authored.

Working target:

```text
api.v_curated_promo_discovery
```

## Required design decisions

### 1. API schema

Specify:

```text
schema: api
purpose: application-facing low-privilege read contracts
```

State explicitly that `api.*` is not a producer-write schema.

### 2. View contract

Specify:

```text
api.v_curated_promo_discovery
```

including:

- exact selected columns;
- exact types;
- source/dependency strategy;
- whether definition is copied/adapted from the current public view;
- whether the API view references `publish.*` directly or another accepted internal view;
- ordering/filter semantics, if any are embedded in the view.

Do not add columns solely because they are convenient.

### 3. Compatibility strategy

Choose and document one:

```text
A. create api view while retaining public view temporarily
B. recreate/move view with a compatibility object for remaining consumers
C. another reviewed strategy
```

Default preference is A because it minimizes cutover coupling.

### 4. View execution model

Record:

- owner;
- `security_invoker` choice;
- consequences for base-table privileges;
- RLS interaction;
- why the low-privilege identity does not gain unintended producer access.

If `security_invoker=true` would require direct base-table grants that weaken `publish.*` isolation, do not adopt it blindly. Design the contract/security model that preserves both low-privilege API reads and producer isolation.

### 5. Privilege matrix

Approve an explicit matrix for:

```text
anon/publishable-compatible
authenticated
service_role
postgres/owner
```

At minimum:

```text
site identity:
USAGE api                   = yes
SELECT api approved view    = yes
INSERT/UPDATE/DELETE        = no
USAGE publish               = no
SELECT publish relations    = no
```

### 6. PostgREST exposure

Specify required configuration:

```text
pgrst.db_schemas includes api
```

and Supabase Data API exposed-schema state.

Define exact reload/verification expectations.

### 7. Site query contract

Specify the target application call shape:

```ts
client
  .schema('api')
  .from('v_curated_promo_discovery')
  .select(EXPLICIT_COLUMN_LIST)
```

The application remains server-side and low-privilege.

### 8. Rollback

Document rollback for W3-C:

- remove/revert new API view/schema changes if necessary;
- do not damage `publish.*`;
- do not drop existing `public.v_curated_promo_discovery` as part of initial W3-C.

## Required output

Create/update an architecture decision section or evidence document containing:

```text
contract name
column contract
dependency design
owner
view security model
schema grants
relation grants
PostgREST config
compatibility strategy
rollback
```

Conclusion must be:

```text
APPROVED FOR W3-C
```

before migration implementation begins.

## Out of scope

- writing migration SQL;
- applying production changes;
- changing `jackpot-site` runtime;
- retiring public view;
- event overlap.

## Stop conditions

Stop if:

- producer isolation and low-privilege view execution cannot both be satisfied;
- the design requires service-role for ordinary site reads;
- the contract must materially widen beyond JSE-S3 without product review;
- PostgREST exposure behavior remains ambiguous.

## Acceptance checklist

- [x] exact API object name approved
- [x] exact columns approved
- [x] dependency strategy approved
- [x] compatibility strategy approved
- [x] owner/security_invoker/RLS model approved
- [x] privilege matrix approved
- [x] PostgREST configuration approved
- [x] rollback approved
- [x] conclusion `APPROVED FOR W3-C`

Status: [_status-W3-B.md](./_status-W3-B.md) · Evidence: [W3-B-api-schema-design-acceptance.md](../../evidence/db-wave-3/W3-B-api-schema-design-acceptance.md)
