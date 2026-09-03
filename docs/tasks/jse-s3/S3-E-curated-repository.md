# S3-E — Low-privilege curated repository

| Field | Value |
|---|---|
| Track | S3-E |
| Type | Code + tests |
| Depends on | S3-D |
| Blocks | S3-F |
| Estimate | M |
| PR grouping | PR 4 |

## Goal

Reimplement the curated public-read boundary as a domain-specific repository. Do **not** copy source `curatedPromos.ts`, `artifact-queries.ts`, or `supabase-server.ts`.

## Decisions to assume

- **D-S3-04** — only `public.v_curated_promo_discovery` + selected-column allowlist
- **D-S3-05** — low-privilege identity only (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, with explicit anon compatibility fallback if needed). Never service-role/secret fallback
- **D-S3-07** — domain repository, not unrestricted generic client exposure to app code
- **D-S3-08** — mock/fixture path may exist for tests/dev; must never silently become production fallback
- **D-S3-09** — add `@supabase/supabase-js` now (first justified point)

## REIMPLEMENT (behavior only)

Source behavior reference (do not copy file):

```text
src/lib/server/curatedPromos.ts
```

Preferred target shape:

```text
src/lib/server/publicSupabase.ts          # optional small helper
src/lib/server/curatedPromoRepository.ts  # domain API
```

API intent:

```ts
getCuratedPromos({ activeOnly: true, limit: 50 })
```

## Implementation requirements

1. Add `@supabase/supabase-js` and, if the server module needs it, explicit `server-only`.
2. Implement low-privilege server client config reading only approved env names. Missing config must fail closed / return a structured safe error — never invent elevated credentials.
3. Reject or ignore any attempt to configure service-role/secret keys for this path (do not read `SUPABASE_SERVICE_ROLE_KEY` even if present in the environment).
4. Query only `public.v_curated_promo_discovery` with the explicit column allowlist from D-S3-04. No `select('*')`.
5. Enforce bounded `limit` (default and max).
6. Map rows through the S3-B `curatedPromoDiscoveryMapper`.
7. Do not attach event overlaps.
8. Add unit/integration-style tests that prove:
   - selected-column / table name contract (mock Supabase client is fine)
   - mapper boundary used
   - missing config fails safely
   - no service-role fallback branch exists in code
9. Optional explicit fixture/mock loader for tests/dev must be **opt-in** (named export / env that cannot be ambiguous with production). Production path must not catch live failures and swap to fixtures.
10. Update provenance: mark repository as **REIMPLEMENT**; record excluded source files intentionally not copied.
11. Do not mount the repository on the homepage yet (S3-G). Export is enough for S3-F/G.

## Suggested deliverables

- `publicSupabase` helper (optional) + `curatedPromoRepository`
- Repository tests
- `.env.example` entries for `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (and documented anon fallback name if used) — no secrets
- Provenance + `_status-S3-E.md`

## Out of scope

- Database grant/RLS verification (S3-F)
- Homepage live wiring (S3-G)
- Copying source curated server helper
- Analytics / overlaps

## Acceptance checklist

- [ ] `@supabase/supabase-js` added with justification
- [ ] Domain repository queries only the approved view + columns
- [ ] Bounded limit enforced
- [ ] Mapper boundary preserved
- [ ] No service-role/secret read or fallback
- [ ] Missing config fails safely
- [ ] Mock path cannot silently mask production failures
- [ ] Tests cover query shape / fail-closed behavior
- [ ] Homepage not yet switched to live data
- [ ] Provenance updated

## Agent prompt

```text
Implement only S3-E from docs/tasks/jse-s3/S3-E-curated-repository.md
REIMPLEMENT a low-privilege curatedPromoRepository over
public.v_curated_promo_discovery with explicit columns. Never copy
artifact-queries or use service-role. No homepage live wiring yet.
```
