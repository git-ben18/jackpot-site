# S5-B — Public shell allowlist

| Field | Value |
|---|---|
| Track | S5-B |
| Type | Code + tests + provenance |
| Depends on | S5-A accepted |
| Blocks | S5-G |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Replace the construction-only wrapper with the minimal permanent first-release public shell, built from the S5-A allowlist rather than copied from the legacy root layout.

The shell is the code and behavior surrounding every public page. It must remain small, intentional, and independent of legacy dashboard/session behavior.

## Allowed responsibility

The first-release shell may own:

~~~text
document metadata
global styles/font setup
header + approved navigation
main content slot
footer + approved legal links
consent-control mount point if required by S5-D
~~~

S5-B must not implement product telemetry logic.

## Source dispositions

Use S5-A/JSE-003 authority. Expected dispositions:

- root layout — REIMPLEMENT;
- navbar — REIMPLEMENT;
- footer — REIMPLEMENT;
- cookie banner — REIMPLEMENT only with real S5-D enforcement;
- ExploreFAB — EXCLUDE;
- legacy /discover-offers and newsletter artifact links — EXCLUDE;
- legacy AcquisitionSignup / EmailSignupForm fallback — EXCLUDE;
- SessionInit / generic legacy tracker initialization — EXCLUDE.

A useful visual style is not permission to copy a source dependency graph.

## Implementation requirements

1. Reimplement src/app/layout.tsx from the allowlist.
2. Header:
   - brand link to /;
   - only S5-A-approved routes;
   - no confirmation route as primary navigation;
   - no unimplemented/dead links.
3. Footer:
   - approved brand/legal/contact links only;
   - Privacy link required;
   - footer DOI only if S5-A explicitly approved it;
   - no legacy signup writer/fallback.
4. Remove construction/staging visitor-facing shell text once approved public-facing replacement copy exists.
5. Update scaffold metadata to approved product-facing metadata without implying deployment or authority transfer.
6. Preserve semantic header/nav/main/footer and keyboard-accessible links.
7. Keep root dependency graph narrow:
   - no global Supabase admin;
   - no newsletter-service transport in layout;
   - no global data fetch for shell;
   - no SessionInit;
   - no telemetry/provider network side effect in this task.
8. Provide a stable mount seam for S5-D consent controls if required.
9. Record provenance for any source-derived visual/content structure.

## Explicit exclusions

The active root shell must not import/mount by inference:

~~~text
SessionInit
ExploreFAB
legacy CookieBanner
legacy useTracker
LandingDashboardClient
HottestOffers
event dashboard/drawer
AcquisitionSignup
EmailSignupForm
~~~

## Required tests

At minimum prove:

- brand and approved links render;
- all shell links resolve to accepted routes;
- forbidden route links are absent;
- Privacy is reachable from the shell;
- child page content renders inside main;
- no excluded global component is imported;
- no root/global analytics or network side effect is introduced;
- footer DOI behavior matches S5-A;
- production build route inventory contains only intentional routes.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-B.md with target SHA, before/after shell inventory, route/link allowlist, target paths, excluded dependencies, provenance, tests/build evidence, and accepted/blocked conclusion.

## Out of scope

Privacy Policy content, consent state, telemetry event contract/implementation, new product routes, hosted scripts, Vercel deployment, DNS, and public authority transition.

## Acceptance checklist

- [ ] Root shell rebuilt from S5-A allowlist.
- [ ] Header/footer contain only approved routes.
- [ ] Privacy linked.
- [ ] Footer DOI matches frozen decision.
- [ ] No ExploreFAB, SessionInit, or legacy tracker mounted globally.
- [ ] No legacy acquisition fallback enters the shell.
- [ ] Construction-facing shell copy removed/replaced without authority overclaim.
- [ ] Accessibility and route/import tests pass.
- [ ] Provenance recorded.
- [ ] No deployment/public authority implied.

## Agent prompt

~~~text
Implement only S5-B from docs/tasks/jse-s5/S5-B-public-shell-allowlist.md.
Rebuild the first-release root layout/header/footer from the S5-A allowlist.
Keep only approved routes/legal links, preserve a narrow consent mount seam,
and exclude SessionInit, ExploreFAB, legacy trackers, fallback acquisition,
and unimplemented navigation. Do not implement telemetry or deploy.
~~~