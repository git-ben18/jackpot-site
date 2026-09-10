# S4-D status

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S4-D-workload-identity-integration.md](./S4-D-workload-identity-integration.md) |
| Result | **IMPLEMENTED** locally — not hosted-accepted |
| Base | `feat/jse-s4-c-same-origin-bff@5f3f0db` (S4-C BFF + transport seam present) |
| Rebuild note | Rebuilt onto the S4-C lineage; does not use the earlier parallel `src/lib/server/newsletter/*` stack from `main@7e7931d` |

## Claims allowed

```text
OIDC caller integration code: IMPLEMENTED
server-only credential boundary: VERIFIED LOCALLY
missing/invalid identity failure path: TESTED
```

## Claims not allowed (deferred to Hosted Acceptance / Epic B)

```text
Vercel OIDC: OPERATIONALLY ACCEPTED
production jackpot-site identity: AUTHORIZED
production newsletter routes: PROVEN
```

## Boundary delivered

```text
jackpot-site BFF (S4-C routes + newsletter-bff)
       ↓
createHttpNewsletterServiceTransport
       ↓
resolveWorkloadIdentityAuth (server-only)
       ↓
obtain Vercel OIDC assertion (@vercel/oidc)  [or explicit local fake]
       ↓
Authorization: Bearer <assertion>
       ↓
jackpot-api-newsletter
```

## Runtime artifacts

```text
src/lib/newsletter/newsletter-service-auth.ts   # S4-D fills S4-C seam
src/lib/newsletter/newsletter-service-client.ts # default auth → resolveWorkloadIdentityAuth
src/lib/newsletter/newsletter-bff.ts            # live default transport uses resolved auth
src/lib/__tests__/workloadIdentity.test.ts
```

Dependency: `@vercel/oidc`

## Attachment contract (caller-side)

```text
Authorization: Bearer <workload assertion>
```

Aligned with Vercel OIDC caller guidance and frontend obligations in
`jackpot-api-newsletter` `docs/contracts/frontend-workload-identity-contract.md`
(`origin/main@c6cfaa4`). Exact verifier claim/header acceptance remains **EB-03 /
Hosted Acceptance**.

## Environment contract (names only)

| Name | Purpose |
|---|---|
| `NEWSLETTER_SERVICE_BASE_URL` | Server-only newsletter-service origin (S4-C) |
| `NEWSLETTER_WORKLOAD_IDENTITY_MODE` | `vercel_oidc` (default) or `fake` (local/test only) |
| `NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` | Optional audience for OIDC exchange; unset until EB-03 freezes |
| `NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION` | Deterministic local/test assertion when mode=`fake` |
| `VERCEL_OIDC_TOKEN` | Vercel-provided local/dev token (`vercel env pull`) |

Fake mode is rejected when `NODE_ENV=production` or `VERCEL_ENV` is `preview`/`production`.

## Local development strategy

1. Preferred: `vercel env pull` so `@vercel/oidc` can read `VERCEL_OIDC_TOKEN`.
2. Explicit local/test only: `NEWSLETTER_WORKLOAD_IDENTITY_MODE=fake`.
3. No permanent shared bearer credential for local convenience.

## Checklist

- [x] Workload identity integration exists only on the server side
- [x] Integrated into S4-C transport seam (`newsletter-service-auth` / HTTP client)
- [x] Protected downstream requests fail closed when identity is unavailable
- [x] Browser-provided auth material cannot become downstream workload authority
- [x] Test/fake identity is impossible to use silently in production
- [x] No permanent fallback bearer token without accepted upstream approval
- [x] No identity/token material logged or designed for browser return
- [x] No `NEXT_PUBLIC_*` credential dependency
- [x] Integration locally/static tested
- [x] Evidence says operational Vercel OIDC is deferred to Hosted Acceptance
- [x] No deployment performed
