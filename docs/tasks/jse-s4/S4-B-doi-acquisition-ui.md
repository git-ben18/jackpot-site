# S4-B — DOI acquisition UI

| Field | Value |
|---|---|
| Track | S4-B |
| Type | Code + tests |
| Depends on | S4-A |
| Blocks | S4-G |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Implement the public newsletter acquisition UI in `jackpot-site` as a DOI-only experience. Preserve approved source presentation intent where useful, but remove all legacy writer/fallback behavior and bind the UI only to the target same-origin BFF contract.

This task does **not** require hosted deployment, real newsletter mutation, real email delivery, or public acquisition enablement.

## Source / authority inputs

Use S4-A's frozen source and product SHAs. Expected source dispositions from the extraction authority:

- `InlineNewsletterHero` — **REIMPLEMENT**.
- `DoiNewsletterSignupForm` — **COPY + HARDEN**.
- acquisition wrapper(s) — migrate only if S4-A/JSE-003 explicitly approves them and they simplify the DOI-only target.
- legacy fallback branches — **EXCLUDE**.

EC-05A / product authority remains authoritative for consent, age confirmation, approved copy, and confirmation expectations.

## User-facing responsibility

The UI should own only browser concerns:

```text
visitor input
   ↓
client validation / UX state
   ↓
same-origin subscribe client
   ↓
jackpot-site BFF
```

It must not know the newsletter-service hostname, workload credential, Supabase credentials, or backend persistence model.

## Implementation requirements

1. Reimplement the newsletter hero from an allowlist.
   - Preserve only approved public-site content and layout intent.
   - Keep the target homepage dependency graph narrow.
   - Do not restore source-only modal/slide-in/footer fallback behavior unless separately approved.
2. Adopt/harden the DOI signup form.
   - email input;
   - explicit newsletter consent control where required by product authority;
   - explicit 21+ / age-confirmation evidence where required;
   - honeypot or approved browser-side abuse field if part of the frozen contract;
   - accessible labels, validation messaging, focus behavior, and submission state.
3. Bind submission only to a same-origin target client/route.
   - no direct `jackpot-api-newsletter` URL in browser code;
   - no `NEXT_PUBLIC_*` backend-service hostname needed by the form;
   - no Supabase mutation from the browser.
4. Preserve non-enumerating success semantics.
   - A successful request must not tell the visitor whether an address already exists, is suppressed, or was newly created.
   - Use the product-approved generic “check your email if eligible” class of outcome.
5. Implement explicit browser states:
   - idle;
   - validating;
   - submitting;
   - generic accepted/requested state;
   - rate/cooldown-safe state if exposed by the BFF contract;
   - recoverable generic error;
   - kill-switch/unavailable state.
6. Do not treat arbitrary `2xx` JSON as success. The client must consume the target BFF's narrow browser-safe schema.
7. Preserve signup-source attribution only through approved vocabulary/mapping. Do not invent backend values in UI code.
8. Add or preserve an acquisition kill-switch seam so later release control can disable newsletter acquisition without restoring a legacy fallback writer.
9. Do not persist legacy newsletter state to browser localStorage/cookies merely because source code did so. In particular, do not restore legacy `subscriber_email_hash`, `email_signup`, reward/access-token state, or equivalent soft-gate persistence unless a separate approved requirement explicitly authorizes it.
10. Keep analytics side effects out of this task unless they are already approved and consent-safe under the later analytics/privacy slice. S4 implementation must not be blocked on analytics.

## Required tests

At minimum cover:

- valid email + required consent/age evidence creates one same-origin BFF request;
- invalid email is rejected before network call;
- missing required consent/age evidence is rejected before network call;
- successful generic BFF response renders the approved non-enumerating state;
- backend/BFF generic error renders retry-safe failure without exposing internals;
- repeated submit is disabled or safely controlled while in-flight;
- kill-switch state prevents mutation request;
- browser bundle/test source contains no direct newsletter-service hostname or server-only credential access;
- no legacy `/api/subscribe` call exists in the migrated component/client path.

Prefer behavior tests over snapshots for security/contract behavior.

## Security requirements

- Never render or log confirmation tokens, service credentials, Supabase service-role values, OIDC assertions, or raw backend error bodies.
- Treat backend-provided message strings as untrusted; the UI should prefer bounded local product copy keyed from sanitized status.
- Do not add `dangerouslySetInnerHTML` or equivalent rendering for backend messages.
- Do not encode canonical subscriber state in client storage.

## Evidence / deliverables

- Reimplemented hero component.
- Hardened DOI form.
- Same-origin browser client adapter or hook as approved by S4-C's contract seam.
- Focused component/client tests.
- Provenance ledger entries for copied/adapted source artifacts.
- `_status-S4-B.md` or equivalent evidence note containing target paths, tests, source SHAs, and excluded source dependencies.

## Out of scope

- Implementing target BFF route logic (S4-C).
- Workload identity (S4-D).
- Confirmation page/flow (S4-E).
- Supabase schema/RLS/grant changes.
- Real SendGrid delivery.
- Vercel deployment/configuration.
- Analytics network side effects not required for DOI functionality.
- Public acquisition enablement.

## Acceptance checklist

- [ ] Hero is reimplemented from the allowlisted source/product intent.
- [ ] DOI form is hardened and uses same-origin submission only.
- [ ] Required consent and age evidence are represented exactly as product authority requires.
- [ ] Generic/non-enumerating success UX is preserved.
- [ ] No legacy fallback writer or `/api/subscribe` path exists.
- [ ] No direct browser→newsletter-service request exists.
- [ ] No legacy access/reward-token or signup-cookie/localStorage behavior is introduced.
- [ ] Kill-switch/unavailable behavior is implemented without fallback persistence.
- [ ] Focused UI/client tests pass.
- [ ] No hosted deployment or real mutation required/performed.

## Agent prompt

```text
Implement only S4-B from docs/tasks/jse-s4/S4-B-doi-acquisition-ui.md.
Build the DOI-only newsletter hero/form against the target same-origin BFF seam.
Preserve consent/21+ and non-enumerating UX, exclude every legacy writer/fallback,
and do not deploy, change Supabase, implement OIDC, or send real email.
```
