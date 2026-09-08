# DB-W3-E — `jackpot-site` API contract cutover

| Field | Value |
|---|---|
| Track | DB-W3-E |
| Type | Application code + tests |
| Depends on | W3-D `ACCEPTED` |
| Blocks | W3-F and JSE-S3 live integration |
| Primary repo | `git-ben18/jackpot-site` |

## Goal

Update the low-privilege curated repository to consume the accepted `api.*` contract instead of the transitional `public.*` view.

Target:

```text
api.v_curated_promo_discovery
```

## Relationship to existing JSE-S3

This packet refreshes the physical database contract assumed by:

```text
docs/tasks/jse-s3/S3-E-curated-repository.md
```

Preserve all valid S3-E security/application behavior:

- domain-specific repository;
- low-privilege site identity;
- no service-role read/fallback;
- selected-column allowlist;
- bounded limit;
- mapper boundary;
- fail-closed configuration/query behavior;
- no production fixture fallback;
- no event-overlap attachment.

Only the accepted schema/object contract changes.

## Required implementation

Preferred application shape:

```ts
const query = client
  .schema('api')
  .from('v_curated_promo_discovery')
  .select(EXPLICIT_COLUMN_LIST)
```

Requirements:

1. explicit `.schema('api')`;
2. exact selected-column allowlist approved in DB-W3;
3. no `select('*')`;
4. no `SUPABASE_SERVICE_ROLE_KEY`;
5. no direct `publish.*` references;
6. no fallback to `public.v_curated_promo_discovery` unless DB-W3 explicitly approved a temporary application fallback (default: do not add one);
7. missing config/query errors fail safely;
8. DTO mapper remains unchanged unless contract evidence requires a reviewed change;
9. event overlap remains deferred;
10. do not mount live homepage behavior until the applicable JSE-S3 sequencing allows it.

## Existing PR handling

If an open S3-E PR still targets:

```text
public.v_curated_promo_discovery
```

refresh that PR or supersede it.

Do not merge the stale physical contract merely because its security pattern is otherwise correct.

## Tests

Add/update guardrails that prove:

```text
schema('api')
from('v_curated_promo_discovery')
explicit column list
no service-role
no publish.*
no production fixture fallback
```

Run repository-standard:

```text
npm test
npm run typecheck
npm run build
```

when available/configured.

## Documentation updates

Refresh JSE-S3 documentation that still treats `public.v_curated_promo_discovery` as the final contract.

Recommended updates:

- D-S3-04 physical contract;
- S3-E task packet;
- S3-F references where superseded by DB-W3 evidence;
- S3-G live integration expectation;
- provenance/status docs.

Preserve historical records where clearly marked historical; do not rewrite old evidence as if the new contract existed at the time.

## Acceptance checklist

- [x] application uses explicit `api` schema
- [x] approved view name used
- [x] explicit columns preserved
- [x] mapper boundary preserved
- [x] no service-role
- [x] no `publish.*` direct read
- [x] no silent public-view fallback unless explicitly approved
- [x] tests pass
- [x] typecheck passes
- [x] build passes
- [x] JSE-S3 current planning docs refreshed
- [x] ready for W3-F / subsequent S3-G

Status: [_status-W3-E.md](./_status-W3-E.md)
