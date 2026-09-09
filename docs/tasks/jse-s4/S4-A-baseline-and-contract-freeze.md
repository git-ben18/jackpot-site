# S4-A — Baseline + contract freeze

| Field | Value |
|---|---|
| Track | S4-A |
| Type | Docs / metadata / contract inventory |
| Depends on | Accepted S3 implementation baseline |
| Blocks | S4-B, S4-C, S4-D, S4-E |
| Estimate | S |
| Repo | `git-ben18/jackpot-site` |

## Goal

Freeze the JSE-S4 starting point and the newsletter-acquisition contract before runtime implementation begins. This task is documentation and inventory only. It must prevent later agents from reopening product, trust-boundary, or legacy-fallback questions while implementing individual S4 slices.

JSE-S4 is an **implementation-readiness epic**. S4 completion does not require a Vercel deployment, hosted OIDC acceptance, production Supabase mutation testing, real SendGrid delivery, public DOI enablement, or production public-site authority.

## Authorities to freeze

Record the exact commit SHA inspected for each authority at task execution time:

1. `git-ben18/jackpot-news`
   - ADR-0003 — Acquisition Runtime Hosting and Workload Identity
   - ADR-0004 — Public Site Extraction and Frontend Authority Transition
   - EC-05A signup/confirmation product decisions
   - P0 acquisition blocker workplan where it remains current release guidance
2. `git-ben18/rewards-maxxing-frontend`
   - `JSE-001` source extraction architecture/trust boundary
   - `JSE-003` verified file-level source handoff
3. `git-ben18/jackpot-api-newsletter`
   - current public acquisition routes and schemas
   - current workload-identity contract / hosted-runtime Epic B
4. `git-ben18/jackpot-site`
   - accepted S3 descendant SHA used as the S4 target baseline

Do not infer that a PR, local branch, deployment, or operator statement has transferred production authority. Record repository evidence and distinguish implementation completion from hosted/production acceptance.

## Frozen target topology

```text
Browser
  |
  | same-origin only
  v
jackpot-site
  |  newsletter UI
  |  confirmation UI
  |  same-origin BFF
  |
  | authenticated server-to-server request
  v
jackpot-api-newsletter
  |                 \
  v                  v
Supabase            SendGrid
```

The browser must never call the newsletter-service hostname directly.

## Source dispositions to verify

Verify the following against current `JSE-003`; record exact source paths and source SHA in the S4 provenance/status evidence.

Expected dispositions from the accepted extraction architecture:

- `src/components/InlineNewsletterHero.tsx` — **REIMPLEMENT** in target; preserve approved presentation/copy intent, DOI-only.
- `src/components/newsletter/DoiNewsletterSignupForm.tsx` — **COPY + HARDEN**.
- `src/lib/newsletter/subscribe-client.ts` — **COPY + HARDEN**, same-origin only.
- `src/lib/newsletter/confirm-client.ts` — verify disposition; same-origin only if adopted.
- `src/lib/newsletter/doi-constants.ts` — verify product-authority relationship before copying constants.
- source same-origin newsletter BFF subscribe route — **REIMPLEMENT**.
- source confirm/validate BFF route — **REIMPLEMENT**.
- source confirm-consume BFF route — **REIMPLEMENT**.
- legacy `POST /api/subscribe` — **DO NOT EXTRACT / EXCLUDE**.

A source import is not permission to copy its transitive dependency.

## Canonical newsletter-service contract inventory

Freeze the backend route inventory used by S4. At minimum verify the current service contract for:

```text
POST /api/public/newsletter/subscribe
POST /api/public/newsletter/confirm/validate
POST /api/public/newsletter/confirm
```

For every route record:

- request schema;
- response schema;
- HTTP status behavior;
- allowed status vocabulary;
- non-enumeration semantics;
- timeout/retry expectations if defined;
- correlation/request identifier behavior if defined;
- authorization requirement;
- whether the route can cause subscriber/token/SendGrid side effects.

Current backend evidence is expected to include consent fields equivalent to:

```text
consentPolicyVersion
consentAccepted: true
ageConfirmed: true
signupSource
```

and signup sources including values such as `website_footer`, `newsletter_landing`, `event_page`, `admin_import`, and `other`. Do not silently delete or rename backend vocabulary in target code; translation belongs in the BFF and must be explicit.

## Prohibited legacy behavior

Record these as global S4 invariants:

1. No `POST /api/subscribe` in `jackpot-site`.
2. No writes to legacy `email_signups` or equivalent legacy subscriber persistence.
3. No legacy access-token / reward-token minting as newsletter signup behavior.
4. No browser-to-`jackpot-api-newsletter` direct request.
5. No newsletter acquisition fallback that bypasses the canonical newsletter service.
6. No Supabase service-role credential in browser or newsletter BFF merely to implement acquisition.
7. No production mutation or real email send required for S4 implementation completion.
8. No arbitrary preview deployment gains production newsletter authority.

## Implementation requirements

1. Record the S4 start SHA from an **accepted S3 descendant**. If the current default branch does not yet contain the accepted S3 integration/closeout, record the discrepancy and do not pretend it does; S4 implementation must branch from the accepted baseline once available.
2. Create or extend an S4 provenance ledger/status artifact that records source repo/path/SHA, disposition, target path, hardening notes, and excluded transitive dependencies.
3. Create a route/contract matrix covering browser DTO → target BFF DTO → canonical newsletter-service DTO → sanitized browser response.
4. Record which product values are authoritative upstream rather than invented in `jackpot-site` (consent policy version, signup source semantics, confirmation states, age/consent evidence).
5. Record the workload-identity implementation boundary: S4 implements caller-side integration code; operational Vercel OIDC proof is deferred to Hosted Acceptance.
6. Record the release boundary: S4 does not authorize deployment, public DOI, real SendGrid traffic, production Supabase mutation acceptance, production identity binding, DNS/Cloudflare cutover, or transfer of public-site authority.

## Suggested deliverables

- `docs/provenance/jse-s4-ledger.md` or equivalent S4 section in the existing provenance system.
- `docs/tasks/jse-s4/_status-S4-A.md` containing frozen SHAs, contract inventory, source dispositions, and open discrepancies.
- A route/DTO matrix referenced by S4-C, either embedded in the status file or in a dedicated contract note.

## Stop conditions

Stop S4-A and escalate rather than invent a decision if:

- ADR-0003/0004 and current newsletter-service behavior conflict materially;
- EC-05A product semantics cannot be reconciled with the backend schema;
- `JSE-003` no longer classifies a required source file;
- the accepted S3 baseline is unclear;
- a proposed implementation would require a legacy writer or direct browser→service call;
- completing the task appears to require a production deployment or secret disclosure.

## Out of scope

- Runtime component migration.
- BFF implementation.
- OIDC implementation.
- Vercel configuration/deployment.
- Supabase DDL/RLS/grant changes.
- SendGrid configuration or real sending.
- Cloudflare/DNS changes.
- Public DOI enablement.

## Acceptance checklist

- [ ] Accepted S3 descendant SHA recorded as S4 baseline, or discrepancy explicitly recorded.
- [ ] Upstream authority SHAs recorded.
- [ ] JSE-003 source dispositions verified.
- [ ] Canonical backend route/request/response matrix frozen.
- [ ] Product-owned consent/source/confirmation semantics identified.
- [ ] Legacy `/api/subscribe` and legacy persistence explicitly excluded.
- [ ] Browser→service direct calls explicitly prohibited.
- [ ] S4 implementation vs Hosted Acceptance boundary recorded.
- [ ] No production deployment/configuration/mutation performed.

## Agent prompt

```text
Implement only S4-A from docs/tasks/jse-s4/S4-A-baseline-and-contract-freeze.md.
Docs/metadata only. Freeze accepted repository SHAs, source dispositions, product
and backend contracts, and the S4 implementation-vs-hosted-acceptance boundary.
Do not copy runtime files, deploy anything, change Supabase, or send email.
```
