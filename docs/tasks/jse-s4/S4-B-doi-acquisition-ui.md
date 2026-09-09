# S4-B — DOI acquisition UI

| Field | Value |
|---|---|
| Track | S4-B |
| Type | Code + tests |
| Depends on | S4-A (**accepted** on `main` via PR #17) |
| Blocks | S4-G |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Implement the public newsletter acquisition UI in `jackpot-site` as a DOI-only experience. Preserve approved source presentation intent where useful, but remove all legacy writer/fallback behavior and bind the UI only to the target same-origin BFF contract frozen in S4-A.

This task does **not** require hosted deployment, real newsletter mutation, real email delivery, or public acquisition enablement.

S3-G/S3-H are not on `main`. That discrepancy is recorded in S4-A and **does not block** S4-B.

## Source / authority inputs

Read these **before** copying or implementing runtime files:

1. [`_status-S4-A.md`](./_status-S4-A.md) — inspected SHAs, dispositions, product values.
2. [`s4-newsletter-contract-matrix.md`](./s4-newsletter-contract-matrix.md) — browser DTO, statuses, honeypot rule.
3. [`jse-s4-ledger.md`](../../provenance/jse-s4-ledger.md) — record adoption rows at implementation time.

Do **not** use `cursor/jse-s4-a-b-doi-acquisition-feca` or draft PR #16 as S4-A or S4-B authority. That work followed a provisional freeze (`newsletter_doi_v1`, REIMPLEMENT where JSE-003 says COPY + HARDEN).

### Frozen SHAs

| Item | SHA |
|---|---|
| Functional source copy baseline | `rewards-maxxing-frontend@466bfb065a9c34010ee0f0de22b419299259fa46` |
| JSE-003 inspected | `rewards-maxxing-frontend@3aa256df708667a8286ddcd2f7056db7b39939c3` |
| Product / EC-05A | `jackpot-news@5bba8b11bf424734ede5eda44e8f5687ca3117d1` |
| S4-A freeze merge | `jackpot-site main@7e7931d` (PR #17) |

Copy from `466bfb0` unless a later classified source SHA is recorded first. Product copy and consent version come from EC-05A / the newsletter registry, **not** from source `doi-constants.ts`.

### Frozen dispositions (do not reopen)

| Source | Disposition | S4-B rule |
|---|---|---|
| `src/components/InlineNewsletterHero.tsx` | **REIMPLEMENT** | DOI-only; mount `DoiNewsletterSignupForm` directly |
| `src/components/newsletter/DoiNewsletterSignupForm.tsx` | **COPY + HARDEN** | Consent + 21+ unchecked; honeypot; generic success; EC-05A copy |
| `src/lib/newsletter/subscribe-client.ts` | **COPY + HARDEN** | Same-origin `POST /api/newsletter/subscribe` only; browser DTO below |
| `src/lib/newsletter/doi-constants.ts` | **COPY + HARDEN** after reconcile | Replace version/copy/sources with frozen product values. Do not copy `newsletter_doi_v1` |
| `src/components/newsletter/AcquisitionSignup.tsx` | **EXCLUDE** | Do not migrate |
| `src/lib/newsletter/doi-flag.ts` | **EXCLUDE / REPLACE** | Kill switch may disable acquisition; must **not** restore `/api/subscribe` |
| `src/app/api/subscribe/route.ts` | **EXCLUDE** | Global S4 invariant |
| `src/lib/newsletter/soft-gate.ts` | **OUT** of S4-B | No signup cookies / `subscriber_email_hash` |
| `confirm-client` / confirm page | Deferred | **S4-E**, not S4-B |
| BFF routes / `core-proxy` / OIDC | Deferred | **S4-C / S4-D** |

## Frozen product values (EC-05A)

Use these strings exactly. Do not invent a privacy-policy URL/version (registry still `null`; public DOI enablement is a later launch gate).

**Consent policy version**

```text
newsletter-consent-us-v1-2026-07-31
```

**Consent checkbox** (unchecked by default; “Privacy Policy” links to `/privacy`):

> I agree to receive the Jackpot Homie email newsletter with curated casino promotion and event information. Emails are generally sent weekly, with occasional additional updates. I can unsubscribe at any time. See the Privacy Policy.

**Age attestation** (unchecked by default; separate from consent):

> I confirm that I am 21 years of age or older.

**Public-UI `signupSource`**

```text
newsletter_landing
```

`website_footer` only if a footer DOI placement actually ships in this packet. Do **not** send `admin_import`, `event_page`, `other`, `rewards_gate`, `feed_modal`, or `region_spotlight`.

## Frozen browser seam (S4-B owns the client; S4-C owns the BFF)

S4-B does **not** implement BFF route logic. Tests mock the same-origin route.

Browser → site only:

```text
POST /api/newsletter/subscribe
```

Forbidden: any `jackpot-api-newsletter` hostname; `POST /api/subscribe`; `NEXT_PUBLIC_*` service URL.

### Browser request allowlist

| Field | Rules |
|---|---|
| `email` | Required; trim; 3–320 chars; plausible email |
| `consentAccepted` | Must be `true` |
| `ageConfirmed` | Must be `true` |
| `consentPolicyVersion` | Must be `newsletter-consent-us-v1-2026-07-31` |
| `signupSource` | `newsletter_landing` (or `website_footer` if footer ships) |
| `website` | Optional honeypot; empty/absent to proceed. Never a service field the UI should expect back |

Do not send source field `consentTextVersion`.

### Browser-safe response `status` (key off JSON `status`, not arbitrary `2xx`)

| `status` | UI |
|---|---|
| `accepted` | Generic non-enumerating success. Local copy: “Check your email to confirm your subscription.” |
| `invalid` | User-correctable; still non-enumerating of membership |
| `rate_limited` | Cooldown-safe |
| `unavailable` | Kill-switch, missing config, or fail-closed (timeout/unknown) |

Do not expose service string `confirmation_if_eligible`, subscriber-state flags, tokens, credentials, or raw upstream JSON. Prefer bounded local product copy keyed from sanitized status.

## User-facing responsibility

```text
visitor input
   ↓
client validation / UX state
   ↓
same-origin subscribe client
   ↓
jackpot-site BFF  (mocked in S4-B tests)
```

The UI must not know the newsletter-service hostname, workload credential, Supabase credentials, or backend persistence model.

## Implementation requirements

1. Reimplement the newsletter hero from an allowlist.
   - Preserve only approved public-site content and layout intent.
   - Keep the target homepage dependency graph narrow.
   - Do not restore modal/slide-in/footer legacy fallback. Footer DOI is optional and, if present, still DOI-only with `signupSource: website_footer`.
2. COPY + HARDEN the DOI signup form from `466bfb0`.
   - email input;
   - EC-05A consent and 21+ controls, both unchecked by default;
   - honeypot field `website`;
   - accessible labels, validation messaging, focus behavior, and submission state.
3. COPY + HARDEN `subscribe-client.ts` to the frozen browser DTO/status schema.
   - no direct `jackpot-api-newsletter` URL;
   - no `NEXT_PUBLIC_*` backend-service hostname;
   - no Supabase mutation from the browser.
4. Preserve non-enumerating success: `status: "accepted"` plus the frozen check-email copy.
5. Implement explicit browser states: idle; validating; submitting; `accepted`; `invalid`; `rate_limited`; `unavailable` (including kill-switch).
6. Do not treat arbitrary `2xx` JSON as success.
7. Do not invent backend signup-source values in UI code.
8. Kill-switch seam: disable acquisition without restoring a legacy writer. Source `doi-flag` off-path is **EXCLUDE**.
9. Do not persist `subscriber_email_hash`, `email_signup` cookies, reward/access-token state, or soft-gate storage.
10. Keep analytics out of this task.

## Required tests

At minimum cover:

- valid email + required consent/age evidence creates one `POST /api/newsletter/subscribe` with the frozen DTO (including `consentPolicyVersion` and `signupSource: newsletter_landing`);
- invalid email is rejected before network call;
- missing required consent/age evidence is rejected before network call;
- non-empty honeypot does not produce a mutation request;
- `accepted` renders the frozen non-enumerating copy;
- `invalid` / `unavailable` / `rate_limited` render retry-safe failure without exposing internals;
- repeated submit is disabled or safely controlled while in-flight;
- kill-switch state prevents mutation request;
- browser bundle/test source contains no newsletter-service hostname, `consentTextVersion`, `newsletter_doi_v1`, or `/api/subscribe`;
- no legacy `/api/subscribe` call exists in the migrated component/client path.

Prefer behavior tests over snapshots for security/contract behavior.

## Security requirements

- Never render or log confirmation tokens, service credentials, Supabase service-role values, OIDC assertions, or raw backend error bodies.
- Treat backend-provided message strings as untrusted.
- Do not add `dangerouslySetInnerHTML` or equivalent rendering for backend messages.
- Do not encode canonical subscriber state in client storage.

## Evidence / deliverables

- Reimplemented hero component.
- Hardened DOI form.
- Same-origin browser client adapter bound to the S4-A matrix (BFF implementation remains S4-C).
- Focused component/client tests.
- Provenance ledger rows for copied/adapted source artifacts (source path, `466bfb0`, JSE-003 disposition, target path, hardening notes).
- `_status-S4-B.md` containing target paths, tests, source SHAs, and excluded source dependencies.

## Out of scope

- Implementing target BFF route logic (S4-C).
- Workload identity (S4-D).
- Confirmation page/flow (S4-E).
- Inventing privacy-policy URL/version.
- Supabase schema/RLS/grant changes.
- Real SendGrid delivery.
- Vercel deployment/configuration.
- Analytics network side effects not required for DOI functionality.
- Public acquisition enablement.

## Acceptance checklist

- [ ] Packet/runtime uses `_status-S4-A.md` + contract matrix; not PR #16 / Cloud Agent freeze.
- [ ] Hero is reimplemented DOI-only; `AcquisitionSignup` is absent.
- [ ] DOI form is COPY + HARDEN from `466bfb0` with EC-05A copy/version.
- [ ] Browser client posts only `POST /api/newsletter/subscribe` with the frozen DTO.
- [ ] Browser `status` handling is `accepted` / `invalid` / `rate_limited` / `unavailable` only.
- [ ] Generic/non-enumerating success UX uses the frozen check-email copy.
- [ ] No legacy fallback writer or `/api/subscribe` path exists.
- [ ] No direct browser→newsletter-service request exists.
- [ ] No legacy access/reward-token or signup-cookie/localStorage behavior is introduced.
- [ ] Kill-switch/unavailable behavior is implemented without fallback persistence.
- [ ] Focused UI/client tests pass.
- [ ] Ledger rows recorded at adoption time.
- [ ] No hosted deployment or real mutation required/performed.

## Agent prompt

```text
Implement only S4-B from docs/tasks/jse-s4/S4-B-doi-acquisition-ui.md.
Read docs/tasks/jse-s4/_status-S4-A.md and
docs/tasks/jse-s4/s4-newsletter-contract-matrix.md first.
Copy from rewards-maxxing-frontend@466bfb0. Use EC-05A consent version
newsletter-consent-us-v1-2026-07-31 and the frozen browser DTO/status
schema. Do not use cursor/jse-s4-a-b-doi-acquisition-feca. Exclude
AcquisitionSignup, /api/subscribe, and source doi-constants product
strings. Do not implement BFF, OIDC, confirm UX, deploy, change
Supabase, or send real email.
```
