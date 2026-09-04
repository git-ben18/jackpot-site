# S3-E status

| Field | Value |
|---|---|
| Date | 2026-09-04 |
| Packet | [S3-E-curated-repository.md](./S3-E-curated-repository.md) |
| Result | Complete (low-privilege repository; no homepage live wiring) |
| Source SHA | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` (behavior reference only) |
| Base | `main@58d8f1e` (S3-D + S3-F-RLS packet merged) |

## Implemented

```text
src/lib/server/publicSupabaseConfig.ts
src/lib/server/publicSupabase.ts
src/lib/server/curatedPromoQuery.ts
src/lib/server/curatedPromoRepository.ts   # getCuratedPromos
src/lib/server/curatedPromoFixtures.ts     # named opt-in only
.env.example
```

`@supabase/supabase-js` and `server-only` added. First justified Supabase dependency (D-S3-09).

## Privilege / query contract

- Env: `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`; `SUPABASE_ANON_KEY` only as explicit fallback.
- Does not read `SUPABASE_SERVICE_ROLE_KEY`.
- Queries only `public.v_curated_promo_discovery` with the D-S3-04 column allowlist. No `select('*')`.
- Default limit 50, max 100. `activeOnly` defaults true (`active`, `unknown`).
- Maps through S3-B `mapCuratedPromoDiscoveryRow`. No overlap attach.
- Missing config / query failure return structured `{ ok: false }` — no fixture swap.

## Not copied

```text
src/lib/server/curatedPromos.ts
src/lib/artifact-queries.ts
src/lib/supabase-server.ts
```

## Commands

```text
npm test
npm run typecheck
npm run build
```

Evidence (2026-09-04, local):

- `npm test` — 47 pass, 0 fail
- `npm run typecheck` — exit 0
- `npm run build` — exit 0; routes remain `/`, `/privacy`, `/newsletter/confirm` only. Homepage does not call `getCuratedPromos`.

## Next

S3-F — prove D-S3-06 and D-S3-11 against this identity. Current S3-F conclusion is `blocked`. Do not mount `getCuratedPromos` on `/` until S3-F is `accepted` (S3-G).
