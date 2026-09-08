# DB-W3-C — Migration and privileges

| Field | Value |
|---|---|
| Track | DB-W3-C |
| Type | Migration + static review + bounded operator apply |
| Depends on | W3-B `APPROVED FOR W3-C` |
| Blocks | W3-D |
| Migration authority | `git-ben18/core` |
| `jackpot-site` DDL | **Forbidden** |

## Goal

Implement the approved `api.*` contract through the existing greenfield Supabase migration authority without modifying producer ownership or exposing `publish.*` to the site identity.

## Required implementation

In `core`, author reviewed migration/config changes for the W3-B design.

Expected categories:

1. create `api` schema if absent;
2. set intended schema ownership;
3. create `api.v_curated_promo_discovery` with the exact approved column contract;
4. apply approved view options/security behavior;
5. grant only required schema `USAGE`;
6. grant only required view `SELECT`;
7. explicitly deny/revoke writes where appropriate;
8. preserve `publish.*` restrictions;
9. add `api` to PostgREST/Data API exposed schemas/config if required;
10. reload PostgREST config/schema as appropriate.

## Preconditions

Migration must fail before mutation when critical assumptions are false.

Preconditions should validate, as appropriate:

- required `publish.*` producer relations exist;
- old public view exists if compatibility strategy depends on it;
- target `api` object does not conflict with an unexpected relation;
- expected role/schema state is present;
- required PostgREST role/config assumptions are known.

## Postconditions

Before commit when practical, assert:

```text
api schema exists
api view exists
approved site role has SELECT
site role has no write privilege
site role has no publish schema USAGE
service/admin roles remain functional
public compatibility view still exists if W3-B chose retention
```

Run a dependency/view smoke inside the transaction where useful.

## Static review evidence

Before production/operator apply, record:

- migration path;
- exact target objects;
- exact grants/revokes;
- exact PostgREST config change;
- no producer-table grant broadening;
- rollback path;
- dependency smoke SQL;
- syntax/static review result.

## Operator sequencing

Use one bounded operator step at a time.

Recommended high-level sequence:

```text
1. confirm W3-B approved design
2. apply reviewed DB/config migration
3. verify topology/privileges
4. continue to W3-D
```

Do not bundle W3-D site-identity acceptance into the destructive/DDL apply itself.

## Safety constraints

Never:

- grant low-privilege SELECT on `publish.*` for convenience;
- use stale Step 3A DuckDB for any event-day/overlap apply/prune;
- alter newsletter objects;
- drop the public discovery view in initial W3-C;
- implement `jackpot-site` runtime changes in the migration PR.

## Out of scope

- jackpot-site cutover;
- public-view retirement;
- event overlap;
- newsletter schema;
- telemetry.

## Acceptance checklist

- [ ] migration lives in `core`
- [ ] static review complete
- [ ] preconditions present
- [ ] postconditions present
- [ ] `api` object created as designed
- [ ] site SELECT grant limited to API contract
- [ ] site writes denied
- [ ] `publish.*` not exposed
- [ ] PostgREST config updated if required
- [ ] compatibility public view preserved
- [ ] operator apply evidence recorded
- [ ] ready for W3-D
