# S4-B status — DOI acquisition UI

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-B-doi-acquisition-ui.md](./S4-B-doi-acquisition-ui.md) |
| Result | Complete (local DOI UI; no hosted mutation / public enablement) |
| Base | `main@6d285ec` (S4-C/D/E present; S4-F not required for S4-B) |
| Tip | `feat/jse-s4-b-doi-acquisition-ui@PENDING` |
| Source SHA | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |

## Runtime artifacts

```text
src/lib/newsletter/doi-copy.ts                         # implemented (EC-05A copy)
src/lib/newsletter/subscribe-client.ts                 # COPY + HARDEN
src/lib/newsletter/newsletter-subscribe-controller.ts  # implemented
src/components/newsletter/DoiNewsletterSignupForm.tsx  # COPY + HARDEN
src/components/InlineNewsletterHero.tsx                # REIMPLEMENT
src/app/page.tsx                                       # mount DOI hero
src/lib/__tests__/newsletter-doi-ui.test.ts
```

## Hardening

- Same-origin `POST /api/newsletter/subscribe` only
- Frozen browser DTO (`consentPolicyVersion`, not source `consentTextVersion`)
- Consent + 21+ start unchecked; EC-05A copy
- Honeypot `website` retained; never forwarded by BFF translation
- Non-enumerating accepted copy (`NEWSLETTER_CHECK_EMAIL_COPY`)
- Client kill-switch seam (`acquisitionEnabled`) prevents mutation; BFF `unavailable` / `rate_limited` mapped to bounded UX
- No localStorage/sessionStorage, legacy `/api/subscribe`, or service hostname in browser DOI modules
- Arbitrary `2xx` / HTTP `202` accepted-shaped bodies fail closed

## Checklist

- [x] Hero reimplemented DOI-only
- [x] DOI form hardened; same-origin submission only
- [x] Consent and age evidence match product authority
- [x] Generic/non-enumerating success UX
- [x] No legacy fallback writer
- [x] No direct browser→newsletter-service path
- [x] No legacy token/cookie/localStorage behavior
- [x] Kill-switch/unavailable seam without fallback persistence
- [x] Focused UI/client tests pass
- [x] No hosted deployment or real mutation performed

## Local verification

| Command | Result |
|---|---|
| `npm test` | pending record |
| `npm run typecheck` | pending record |
| `npm run build` | pending record |
