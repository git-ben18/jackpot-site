# S5-B status — Public shell allowlist

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Packet | [S5-B-public-shell-allowlist.md](./S5-B-public-shell-allowlist.md) |
| Result | **accepted** (local shell REIMPLEMENT; no deployment / authority transfer) |
| Depends on | S5-A accepted — [_status-S5-A.md](./_status-S5-A.md) (`45e9029` start SHA; EX-S5-A-01 closed) |
| Base | `feat/jse-s5-b-initial-commit` fast-forwarded to include S5-A tip `abdfc6e` |
| Tested runtime SHA | filled after implementation commit |
| Provenance | [jse-s5-ledger.md](../../provenance/jse-s5-ledger.md) |

## Runtime artifacts

```text
src/lib/shell/shell-allowlist.ts
src/components/shell/PublicShell.tsx
src/components/shell/SiteHeader.tsx
src/components/shell/SiteFooter.tsx
src/components/shell/ConsentMountSeam.tsx
src/app/layout.tsx
src/app/globals.css                         # footer row styles only
src/lib/__tests__/public-shell-allowlist.test.ts
docs/provenance/jse-s5-ledger.md
docs/tasks/jse-s5/_status-S5-B.md
```

## Before / after shell inventory

| Concern | Before (pre-S5-B) | After |
|---|---|---|
| Root layout | Inline header/main/footer in `layout.tsx` | Allowlisted `PublicShell` composition |
| Metadata description | Construction/staging claim | Product-facing copy from `SHELL_METADATA` (no authority overclaim) |
| Header nav | `/` brand + `/privacy` | Same allowlist via `SiteHeader` |
| Footer | Construction copy + Privacy | Brand line + Privacy legal nav; no DOI form |
| Consent | absent | Empty hidden `#site-consent-root` seam for S5-D |
| Footer DOI | none (matches homepage-only) | unchanged (`SHELL_FOOTER_DOI = homepage-only`) |

## Route / link allowlist

```text
Primary nav:  / , /privacy
Footer legal: /privacy
Flow-only (not linked): /newsletter/confirm
BFF (not nav): POST /api/newsletter/subscribe|confirm/validate|confirm
Forbidden nav: /discover-offers /dashboard /blog /terms /newsletter (+ confirm)
```

Production build route inventory unchanged and intentional: `/`, `/privacy`, `/newsletter/confirm`, three newsletter BFF POSTs.

## Excluded dependencies (not imported by shell)

```text
SessionInit / ExploreFAB / CookieBanner / useTracker
LandingDashboardClient / HottestOffers
AcquisitionSignup / EmailSignupForm
newsletter BFF / identity / transport
curated repository / Supabase admin
GTM / gtag / middleware.ts
```

## Provenance summary

Shell is **REIMPLEMENT** from S5-A allowlist / JSE-003, not a copy of source `layout.tsx` / `Navbar.tsx` / `Footer.tsx`. Ledger: `docs/provenance/jse-s5-ledger.md`.

## Local verification

| Field | Value |
|---|---|
| Date | 2026-09-11 |
| Tested runtime SHA | pending implementation commit |
| Branch | `feat/jse-s5-b-initial-commit` |

| Command | Result |
|---|---|
| `npm test` | **PASS** — 168 tests, 0 fail |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** — intentional first-release routes only |

## Checklist

- [x] Root shell rebuilt from S5-A allowlist
- [x] Header/footer contain only approved routes
- [x] Privacy linked
- [x] Footer DOI matches homepage-only freeze
- [x] No ExploreFAB, SessionInit, or legacy tracker mounted globally
- [x] No legacy acquisition fallback enters the shell
- [x] Construction-facing shell copy removed/replaced without authority overclaim
- [x] Accessibility landmarks (header/nav/main/footer) and route/import tests pass
- [x] Provenance recorded
- [x] No deployment/public authority implied

## Conclusion

```text
S5-B: ACCEPTED (local public shell allowlist)

S5-C: still BLOCKED-PENDING-POLICY-AUTHORITY for acceptance
S5-D: unblocked for fail-closed consent against the empty mount seam
S5-E/F/G/H: unchanged from S5-A
```
