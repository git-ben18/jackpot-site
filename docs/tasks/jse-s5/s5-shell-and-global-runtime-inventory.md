# S5-A supporting inventory — root / global runtime

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Inspected target SHA | `jackpot-site@3bd1fe0347ace48d7a9ab8fdddb80cca066999f5` |
| Authority | [_status-S5-A.md](./_status-S5-A.md) |
| Scope | Reachability from `src/app/layout.tsx`, plus the first-release public route/env surface S5 wraps |

This file is analysis, not permission to copy source modules. Classifications:

```text
KEEP                         already present and allowed in first-release shell
REIMPLEMENT                  keep the responsibility; do not copy the source file
ADD                          missing; later S5 packet may add from the allowlist
EXCLUDE                      must not enter the first-release shell
DEFER                        not first-release; do not implement by inference
BLOCKED-PENDING-AUTHORITY    required input is missing; do not invent
```

Root-layout reachability counts as public dependency reachability (JSE-001 / JSE-003).

## 1. Root layout graph (current target)

`src/app/layout.tsx` is a Server Component. It does **not** import page modules, newsletter BFF, curated repository, providers, or analytics.

```text
src/app/layout.tsx
├── next Metadata                          KEEP (S5-B may replace construction description)
├── next/link                              KEEP
├── ./globals.css                          KEEP (already a hardened subset)
├── <html lang="en">                       KEEP
├── <header>
│   ├── Link /          (brand)            KEEP
│   └── Link /privacy                      KEEP
├── <main>{children}</main>                KEEP
└── <footer>
    ├── construction/staging copy          REIMPLEMENT in S5-B (remove visitor-facing construction claim)
    └── Link /privacy                      KEEP
```

Absent from this graph (source root still mounts these; target must not restore them by inference):

```text
SessionInit
CookieBanner
ExploreFAB
source Navbar.tsx
source Footer.tsx
next/font / Google fonts
GTM / gtag / googletagmanager
middleware.ts
```

## 2. Classification table

| Dependency | Provenance / disposition | Client/server | Classification | Notes |
|---|---|---|---|---|
| Document title/description | Target S2 **implemented** (JSE-003 layout **REIMPLEMENT**) | server | KEEP / S5-B copy update | Current description says construction/staging |
| `lang="en"` | implemented | server | KEEP | |
| `src/app/globals.css` | S2 implemented + S3 Tailwind subset | server CSS | KEEP | System UI fonts; `.scrollbar-hide` / `.chip-strip-fade` for curated chips |
| System font stack | implemented | CSS | KEEP | Do not add `next/font` or hosted webfonts without product authority |
| Inline header (brand + Privacy) | S2 **REIMPLEMENT** of Navbar | server | KEEP | Not a copy of source `Navbar.tsx` |
| Inline footer (Privacy + construction copy) | S2 **REIMPLEMENT** of Footer | server | KEEP structure; REIMPLEMENT visitor copy in S5-B | No DOI form |
| Consent mount | absent | n/a | ADD seam only if S5-D needs it; **no banner** while analytics sink is unauthorized | Decorative banner forbidden |
| `SessionInit` / `POST /api/log-session` | source EXCLUDE | n/a | EXCLUDE | D-S5-10 |
| Source `CookieBanner` / `cookie_consent` | JSE-003 **REIMPLEMENT** if retained | n/a | EXCLUDE from first-release shell | Do not copy; untruthful while no sink |
| `ExploreFAB` / `ExploreDrawer` | EXCLUDE | n/a | EXCLUDE | |
| `src/middleware.ts` / experiments / `session_id` | EXCLUDE | n/a | EXCLUDE | |
| `/terms` | OPTIONAL in JSE-003 | n/a | EXCLUDE | No approved Terms content |
| `/discover-offers`, `/newsletter` artifacts, `/dashboard`, `/blog` | EXCLUDE | n/a | EXCLUDE | Do not create dead nav |
| `robots.ts` | JSE-003 REIMPLEMENT | n/a | DEFER / optional S5-B | Not present; not required to freeze S5-A |
| Favicon / OG assets | OPTIONAL | n/a | DEFER | `public/` has no brand assets in this SHA |
| GTM snippet / provider SDK | REASSESS in JSE-001 | n/a | EXCLUDE until sink authority | D-S5-A-06 |
| Newsletter BFF / OIDC / curated repository | S3/S4 | not layout-reachable | KEEP on their routes | Must not be imported by layout |

## 3. Linked routes from the shell

| Location | Href | First-release status |
|---|---|---|
| Header brand | `/` | Primary nav — KEEP |
| Header | `/privacy` | Primary nav — KEEP |
| Footer | `/privacy` | Legal link — KEEP |
| Shell | `/newsletter/confirm` | **Not linked** — correct (flow-only) |
| Shell | `/terms` | Absent — KEEP absent |
| Shell | `/discover-offers`, `/dashboard`, `/blog`, `/newsletter` | Absent — KEEP absent |

## 4. Cookies, storage, and network from the shell

| Channel | Current layout behavior |
|---|---|
| Cookies | none set or read |
| `localStorage` / `sessionStorage` | none |
| Global fetch / beacon / `sendBeacon` | none |
| Analytics / session side effects | none |
| Environment names read by layout | none |

S4 DOI/confirm tests assert the acquisition UI does not use `localStorage` / `sessionStorage`. S3 composed-presentation tests assert no `useTracker` / `/api/log-click` / `/api/log-interaction`.

## 5. First-release page surface (not layout-reachable, but S5 wraps it)

These are `children` of the shell. Inventory is for later packets, not a copy allowlist.

### `/` (`src/app/page.tsx`)

```text
HomePage  (server; revalidate = 300)
├── InlineNewsletterHero                  REIMPLEMENT (S4)
│   └── DoiNewsletterSignupForm           COPY + HARDEN
│       └── POST /api/newsletter/subscribe (browser same-origin)
└── CuratedPromoLandingSection            COPY + HARDEN (S3-G)
    ├── getCuratedPromos → api.v_curated_promo_discovery
    └── CuratedPromoLandingSectionView
        ├── fail-soft empty
        └── CuratedPromoDiscoveryWidget   COPY + HARDEN (tracker omitted)
            ├── FilterChips
            ├── Carousel / Card           (onOpen → detail)
            ├── DetailSheet               outbound sourceUrl (no log-click)
            └── EmptyState
```

Homepage still contains a muted construction/hosted-enablement note. S5-B owns visitor-facing **shell** copy; do not invent replacement marketing copy here.

DOI signup source frozen at `newsletter_landing`. Footer DOI is **not** mounted.

### `/privacy`

Scaffold only. Placeholder states ACQ-05 / JSE-S5 must close production values. **Not** an approved policy URL/version.

### `/newsletter/confirm`

`NewsletterConfirmClient` (COPY + HARDEN). Flow-only. Token read from query, held in memory, stripped with `history.replaceState`. No layout-level token handling.

### Same-origin BFF (not shell)

```text
POST /api/newsletter/subscribe
POST /api/newsletter/confirm/validate
POST /api/newsletter/confirm
```

Absent: `POST /api/subscribe`.

## 6. Environment names (values not recorded)

Layout reads none. First-release runtime names elsewhere:

| Name | Scope | Owner |
|---|---|---|
| `SUPABASE_URL` | server | S3 curated read |
| `SUPABASE_PUBLISHABLE_KEY` | server | S3 curated read |
| `SUPABASE_ANON_KEY` | server compatibility fallback | same privilege class as publishable; never service-role |
| `CURATED_PROMO_DISCOVERY_MOCK` | local/dev only | ignored in production |
| `NEWSLETTER_SERVICE_BASE_URL` | server | S4 BFF |
| `NEWSLETTER_ACQUISITION_ENABLED` | server | kill switch; unset fail-closed |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | server | `vercel_oidc` or local `fake` |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | server optional | unset until EB-03 |
| `NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION` | local/test | forbidden in production/preview |
| `VERCEL_OIDC_TOKEN` | Vercel runtime | not a committed secret |
| `NODE_ENV` / `VERCEL_ENV` | runtime | fake-identity prohibition |

No `NEXT_PUBLIC_*` newsletter or analytics names exist. Do not add `NEXT_PUBLIC_GTM_*` or similar without sink authority.

## 7. Source shell comparison (do not copy)

At functional source `466bfb0`, `src/app/layout.tsx` mounts `SessionInit`, `CookieBanner`, `ExploreFAB`, `Navbar`, `Footer` on every page. Target layout already avoided that graph. S5-B must rebuild from this allowlist, not from the source file.
