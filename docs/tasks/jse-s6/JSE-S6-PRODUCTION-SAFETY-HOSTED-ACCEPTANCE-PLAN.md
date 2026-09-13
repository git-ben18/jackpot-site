# JSE-S6 — Production-Safety Audit and Hosted Acceptance Plan

| Field | Value |
|---|---|
| Slice | `JSE-S6` |
| Repo | `git-ben18/jackpot-site` (this repo’s packets only) |
| Type | Implementation-readiness plan + task decomposition |
| Architecture authority | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + source `JSE-003` |
| Product / release / legal authority | `git-ben18/jackpot-news` (ADR-0003, ADR-0004, ACQ-03/05/06, EC-05A) |
| Newsletter runtime authority | `git-ben18/jackpot-api-newsletter` (Epic B / EB-03 verifier) |
| Upstream implementation | accepted JSE-S3 curated discovery + JSE-S4 newsletter implementation + JSE-S5 local shell/consent/telemetry (S5-C/G/H still open) |
| Status | Planning packet only — no hosted deployment, public DOI, or production authority implied |

## 1. Purpose

JSE-S6 is the **production-safety audit and hosted-acceptance** slice. It takes the locally implemented first-release surface and proves it is safe to host in a **restricted** staging topology, then records whether the target is **eligible** for ACQ-06 controlled DOI E2E and an ADR-0004 cutover **decision**.

```text
Local S3/S4/S5 implementation
  ↓
S6 production-safety inventory
  ↓
restricted Vercel staging (preview ≠ prod mutation authority)
  ↓
real OIDC + staging newsletter E2E
  ↓
hosted public-surface / fail-soft / rollback evidence
  ↓
eligibility closeout (not public-site authority transfer)
```

S6 does **not** make `jackpot-site` the production public site. Repository creation, a green `next build`, a Vercel preview, or a staging deploy does not transfer ADR-0004 authority.

S4-H already named placeholder Hosted Acceptance proofs **HA-01…HA-08**. This plan turns those placeholders into sequential `jackpot-site` packets and records which proofs belong in other repositories.

## 2. Source-supported requirements

Directly supported by JSE-001 §15 JSE-S6, §17 prohibitions, §18 acceptance inventory, §19–20 cutover/rollback, ADR-0003/0004, and S3/S4/S5 hosted deferrals:

- dependency / route / env inventory against the target;
- no service-role secret in the browser, and none on the server without a justified need;
- no browser-direct `jackpot-api-newsletter` hostname;
- Vercel preview / staging / production workload separation;
- staging E2E against `jackpot-api-newsletter`;
- acquisition kill switch remains off until release gates close;
- rollback is kill switch + Vercel rollback + optional DNS procedure — never a second canonical subscriber writer;
- section 18 evidence table before any cutover decision.

S4-H HA placeholders this plan consumes:

```text
HA-01 restricted Vercel staging topology
HA-02 environment / secret / preview isolation
HA-03 real Vercel OIDC caller + verifier proof
HA-04 hosted BFF → newsletter API contract proof
HA-05 hosted Supabase newsletter path acceptance
HA-06 controlled real SendGrid DOI E2E
HA-07 hosted failure / rollback / security evidence
HA-08 hosted acceptance closeout
```

S4-H: create/activate hosted acceptance only after explicit frontend, newsletter-backend, and Supabase security-readiness review permits **restricted** hosting. S6-A must record that review state. Later packets must not skip it.

## 3. Important unresolved decisions (must not be invented)

S6-A must resolve each item or mark it **BLOCKED-PENDING-AUTHORITY**. Agents may not silently choose for the product.

| Decision | Current evidence / safe default |
|---|---|
| ACQ-05 Privacy Policy URL / version / content | **BLOCKED.** S5-C is not accepted; `/privacy` is scaffold; DOI “Privacy Policy” is plain text on purpose. Public DOI must not enable. |
| S5-G / S5-H closeout | S5-G local proofs exist on a working branch but S5-G cannot conclude accepted while S5-C is blocked. S5-H is not complete. |
| EB-03 / OIDC audience and verifier claims | Unset until `jackpot-api-newsletter` Epic B freezes them. S4-D implemented caller-side code only. |
| Restricted staging project/environment | Must be an explicit operator/hosting decision. Do not use an arbitrary preview as staging. |
| Production analytics sink / GTM | S5-A deferred; production sink is explicit `disabled`. Do not activate a provider because S6 is hosted. |
| Consent cookie / banner | Blocked until a sink is authorized (S5-D). |
| Turnstile (or equivalent) | Documented S4-F deferral. Hosted packet may prove honeypot + kill switch and record Turnstile as still deferred **or** implement it only with `jackpot-news` approval. |
| Cloudflare public hostname / cutover record | JSE-001 open decision #10. Not an S6-C staging requirement. |
| ACQ-03 newsletter trust config for `jackpot-site` | Updates at cutover, not because S6-D code exists. |
| Public DOI enablement | Kill switch + ACQ-05 + hosted proofs + release gate. Not implied by staging E2E. |
| DB-W4 durable telemetry | Only if a production sink is authorized that needs it. Default: not required for S6 eligibility. |

## 4. Proposed S6 planning decisions to freeze

These are the recommended target decisions for S6-A. They are conservative and preserve JSE-001/ADR-0003/0004 trust cuts.

### D-S6-01 — Eligibility, not authority transfer

S6 exit language is: the target is **eligible** for ACQ-06 controlled DOI E2E and a production cutover **decision**.

S6 must not claim:

- public-site authority transferred;
- `rewards-maxxing-frontend` deauthorized;
- production newsletter mutations authorized;
- DNS/Cloudflare cut over;
- public acquisition enabled.

### D-S6-02 — Cross-repository ownership

| Proof | Owner |
|---|---|
| Route/dep/env/credential audit of this app | `jackpot-site` |
| Restricted Vercel frontend staging + secret scope | `jackpot-site` operators + ADR-0003 hosting |
| Real OIDC **caller** evidence | `jackpot-site` |
| Real OIDC **verifier** / claim policy | `jackpot-api-newsletter` Epic B |
| Canonical newsletter mutation + SendGrid | `jackpot-api-newsletter` + existing Supabase/SendGrid authorities |
| HA-05 hosted Supabase **newsletter** path | newsletter-service + DB authority — **never** ad-hoc DDL from this repo |
| Public curated read (`api.v_curated_promo_discovery`) | already S3/DB-W3; S6 proves it **hosted** |
| Privacy URL/version/content | `jackpot-news` / operator (ACQ-05) |
| Cutover / public DOI / DNS | `jackpot-news` release + operators |
| Cross-repo summary | `jackpot-docs` only |

### D-S6-03 — Restricted staging before any public exposure

First hosted target is a **restricted** staging topology (HA-01). It is not the public hostname.

Preview workloads must not receive production newsletter mutation authority (ADR-0003). Fake/local identity must remain impossible in production `NODE_ENV` / `VERCEL_ENV` (already S4-D).

### D-S6-04 — Kill switch remains fail-closed

`NEWSLETTER_ACQUISITION_ENABLED` stays unset/false on hosted environments until release gates named by S6-A are closed. Staging E2E may enable it **only** in the restricted staging environment under controlled test accounts, then restore fail-closed. That enablement is not public DOI.

### D-S6-05 — Reuse S4-G / S5-G scenarios; do not invent a second contract

Hosted newsletter and product proofs reuse already-accepted local scenarios (S4-G assembled path, S5-G consent/telemetry/token hygiene) against real staging identity and services. Do not reopen S4/S5 payload or route allowlists inside S6.

### D-S6-06 — No invented privacy or analytics sink

S6 must not point DOI “Privacy Policy” at `/privacy` as if ACQ-05 approved. S6 must not add GTM, `SessionInit`, or a telemetry DB schema to “complete hosted analytics.” If no sink is authorized, hosted proofs show **zero** optional beacons.

### D-S6-07 — Rollback never restores legacy acquisition

Safe rollback tools remain: acquisition kill switch, Vercel deployment rollback, DNS revert only under an explicit procedure. Do not restore `POST /api/subscribe` or `email_signups`.

### D-S6-08 — Distinguish implementation states

Every S6 status file must distinguish: implemented, configured, deployed, provider-accepted, operationally accepted, production-authoritative.

## 5. Task decomposition

```text
S6-A  hosted-acceptance freeze (SHAs, HA mapping, blockers, readiness review)
  ↓
S6-B  production-safety inventory (routes / deps / env / credentials) — no deploy
  ↓
S6-C  restricted Vercel topology + env/secret/preview isolation     (HA-01, HA-02)
  ↓
S6-D  real Vercel OIDC caller proof + verifier handoff              (HA-03)
  ↓
S6-E  staging BFF → newsletter E2E + controlled SendGrid           (HA-04, HA-05, HA-06)
  ↓
S6-F  hosted public surface (curated live, privacy/consent freeze) 
  ↓
S6-G  hosted failure / abuse / kill-switch / rollback              (HA-07)
  ↓
S6-H  hosted-acceptance closeout / ACQ-06 eligibility              (HA-08)
```

Allowed parallelism after S6-A:

```text
S6-B  (local audit; no hosting)
S6-C  blocked on S6-A + restricted-hosting readiness review
S6-D  blocked on S6-C and EB-03 / verifier authority
S6-E  blocked on S6-D
S6-F  privacy/DOI hyperlink items blocked on ACQ-05 / S5-C
S6-G  may overlap S6-E on the same staging env
S6-H  blocked on S6-B..G (honest blocked conclusion allowed)
```

S6-B may run immediately after S6-A because it is an in-repo audit. S6-C and later must not treat S6-B passing as permission to expose the site publicly.

If S5-C remains blocked, S6-F/H must not call privacy or public DOI complete. S6 may still record other hosted proofs and conclude **blocked-pending-policy-authority (ACQ-05)** rather than inventing legal values.

## 6. S6-wide prohibitions

1. No `POST /api/subscribe` or `email_signups` writer as rollback or “hosted fallback.”
2. No browser-direct newsletter-service calls; no newsletter hostname or OIDC assertion in browser code.
3. No `SUPABASE_SERVICE_ROLE_KEY` / admin client for ordinary public promo rendering.
4. No ad-hoc Supabase DDL/grant/RLS from this repository (HA-05 is not a license to migrate).
5. No preview workload with production newsletter mutation authority.
6. No invented Privacy Policy URL/version/operator/contact.
7. No GTM / `SessionInit` / `/api/log-*` / telemetry DB schema by convenience.
8. No public DOI enablement solely because staging E2E passed.
9. No Cloudflare/DNS cutover from an agent packet unless a later authoritative release packet explicitly does so (default: out of S6-C…G).
10. Do not deauthorize the current production frontend.
11. Record env **names** only; never commit or paste secret values.
12. Distinguish implemented / configured / deployed / provider-accepted / production-authoritative.

## 7. S6 completion definition

S6 may close as **HOSTED ACCEPTANCE COMPLETE (eligibility only)** only when:

- section 18-equivalent evidence exists for the frozen first-release surface;
- production-safety searches pass on the hosted SHA;
- restricted staging is isolated from production mutation authority;
- authorized BFF→newsletter calls succeed and unauthorized/missing identity fail closed;
- staging DOI request and confirmation E2E are proven under controlled conditions **or** explicitly blocked with owner (e.g. SendGrid not yet permitted);
- kill switch still prevents public acquisition;
- analytics/data/API failures do not crash the hosted public site;
- rollback procedure is recorded without a dual subscriber store;
- closeout states eligibility for ACQ-06 / cutover **decision**, not that cutover happened.

If ACQ-05, EB-03, or restricted-hosting review is missing, S6-H must conclude **blocked** (or accepted-with-named-blockers only if a later authority explicitly allows that wording). Placeholders are not acceptance.

## 8. Relationship to remaining S5 work

S5 local implementation can continue in parallel (S5-C, S5-G merge, S5-H). S6-A must freeze **facts**, not wait forever to write the inventory.

S6 must not:

- implement S5-C by inventing policy text;
- treat an unmerged S5-G working tree as the hosted SHA;
- call JSE-S5 IMPLEMENTATION COMPLETE from an S6 packet.

Recommended program order: finish S5-C when ACQ-05 exists → accept S5-G/H → then execute S6-C+. S6-A/B may precede that so the audit baseline is ready.
