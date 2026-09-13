# JSE-S6 — Production Readiness and Security Acceptance Plan

| Field | Value |
|---|---|
| Slice | `JSE-S6` |
| Repo | `git-ben18/jackpot-site` (this repo’s packets only) |
| Type | Production-hardening + hosted release-candidate acceptance |
| Architecture authority | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + source `JSE-003` |
| Product / release / legal authority | `git-ben18/jackpot-news` (ADR-0003, ADR-0004, ACQ-03/05/06, EC-05A) |
| Newsletter runtime authority | `git-ben18/jackpot-api-newsletter` (Epic B / EB-03, EB-05, EB-06) |
| Upstream implementation | accepted JSE-S3 curated discovery + JSE-S4 newsletter implementation + JSE-S5 shell/consent/telemetry work |
| Status | Production-readiness planning and execution authority; does not itself transfer DNS/public-site authority |

## 1. Purpose and posture change

JSE-S6 is the point where the project stops accepting ordinary MVP deferral as the default release posture.

Earlier slices were allowed to implement bounded MVP behavior, preserve fail-closed defaults, and defer hosted/provider/operator controls. JSE-S6 converts those deferrals into one of three outcomes:

1. **implemented and proven** on the exact release candidate;
2. **replaced by an explicitly approved equivalent control** with owner, rationale, scope, and expiry/review date when temporary; or
3. **release blocker**.

A control required for safe public production operation may not be marked complete merely because the application can function without it.

Successful S6 completion means the exact accepted `jackpot-site` candidate is a **production-ready release candidate** in a production-equivalent hosted topology. S6 still does **not** itself:

- transfer ADR-0004 public-site authority;
- change production DNS/Cloudflare;
- enable public DOI;
- deauthorize `rewards-maxxing-frontend`;
- perform the final ACQ-06 public release decision.

Those remain controlled release/cutover actions.

```text
S3/S4/S5 implementation
  ↓
S6-A release-candidate authority/control freeze
  ↓
S6-B full production-security inventory + attack-surface review
  ↓
S6-C production-equivalent restricted Vercel topology
  ↓
S6-D workload authentication + authorization matrix
  ↓
S6-E controlled hosted newsletter preflight
  ↓
S6-F positive + negative public-surface acceptance
  ↓
S6-G resilience / abuse / rollback / operational security
  ↓
S6-H exact-candidate production-readiness certification
  ↓
ACQ-06 / cutover decision
```

## 2. Scope is broader than the original S6 draft

S6 is not limited to features first implemented in S6.

The review must cover **every production-reachable or production-relevant surface in the release candidate**, including:

- features implemented in S2–S5;
- framework-generated routes and handlers;
- transitive dependencies and build/runtime behavior;
- server/browser trust boundaries;
- environment variables and secret scope;
- outbound calls to Supabase, newsletter API, SendGrid-related flows, telemetry providers, and any other configured service;
- cached/static content and error paths;
- deployment/preview behavior;
- common anonymous-Internet misuse cases even when no earlier task packet named them.

The governing question is not “was this feature in the S6 draft?” It is:

> Can an anonymous or malicious Internet client reach, influence, exhaust, bypass, leak through, or materially disrupt this surface in production?

Where applicable, S6-B/G must assess at least:

- dependency/supply-chain posture;
- browser-bundle secret leakage;
- security headers / CSP and referrer behavior;
- malformed, oversized, repeated, and adversarial input;
- route/method probing and unexpected content types;
- direct upstream/API probing and authorization bypass;
- preview-to-production privilege escalation;
- rate-limit / abuse / automation behavior;
- provider, database, network, and identity-provider timeout/failure;
- stack trace / upstream body / sensitive error disclosure;
- token, email, assertion, and secret log redaction;
- request/correlation traceability without introducing product analytics;
- rollback and recovery behavior.

If a control is not applicable, record **N/A by architecture** with evidence. “Not in original packet” is not N/A.

## 3. Hosted Acceptance proofs

S4-H placeholders remain useful, but S6 raises their acceptance standard:

```text
HA-01 production-equivalent restricted Vercel staging topology
HA-02 environment / secret / preview isolation, including negative proof
HA-03 real Vercel OIDC caller + verifier authorization matrix
HA-04 hosted BFF → newsletter API contract
HA-05 accepted hosted Supabase newsletter path proof
HA-06 controlled SendGrid/DOI staging preflight
HA-07 hosted failure / rollback / abuse / operational-security evidence
HA-08 exact-candidate production-readiness closeout
```

A packet may finish execution while an HA contribution remains unsatisfied. Use two separate concepts:

- **packet execution conclusion:** `complete` / `blocked` / `N/A`;
- **acceptance contribution:** `proven` / `N/A-by-authority` / `not-satisfied`.

A blocked packet is not accepted evidence.

## 4. Required authority and blocker rules

S6-A must freeze or block on:

| Area | S6 rule |
|---|---|
| ACQ-05 Privacy Policy | Required for S6-H production-ready certification. Placeholder/scaffold is not acceptance. |
| S5-H | Required as an accepted upstream implementation closeout before S6-H. |
| EB-03 | Must explicitly authorize the `jackpot-site` project/environment pair and define issuer/team/project/env/audience claim policy. Stale legacy-project wording is not acceptable. |
| EB-05 | HA-05 requires accepted hosted Supabase path evidence from the newsletter/DB authority. A citation to “out of repo” alone is insufficient. |
| EB-06 / SendGrid | Controlled real-provider proof required for production-ready certification unless release authority explicitly declares the provider path N/A. |
| Restricted staging | Must be an intentional production-equivalent acceptance environment, not an arbitrary preview. |
| Abuse control | Honeypot alone is not sufficient. Turnstile or an explicitly approved equivalent launch control must be implemented and proven. |
| Analytics | No provider is required if product authority keeps the sink disabled. Disabled must be proven and privacy behavior must be correct. |
| DNS / public hostname | Not required to certify the candidate; remains a cutover control. |
| Public DOI | Not enabled by S6. |
| Production trust cutover | Not performed by S6, but the candidate trust policy must be fully defined and tested in the acceptance environment. |

## 5. Frozen S6 decisions

### D-S6-01 — S6 certifies a production-ready release candidate

S6 exit is no longer merely “eligible for hosted acceptance.”

The successful outcome is:

```text
PRODUCTION-READY RELEASE CANDIDATE
```

for one exact candidate and one recorded acceptance topology.

S6 still does not perform DNS/public authority transfer.

### D-S6-02 — Cross-repository proof is mandatory where authority is cross-repository

| Proof | Owner |
|---|---|
| Route/dep/env/credential/attack-surface audit | `jackpot-site` |
| Restricted Vercel topology + secret scope | `jackpot-site` operators |
| OIDC caller | `jackpot-site` |
| OIDC verifier/claim authorization | `jackpot-api-newsletter` EB-03 |
| Hosted newsletter persistence | `jackpot-api-newsletter` EB-05 + DB authority |
| Hosted provider delivery/webhook | `jackpot-api-newsletter` EB-06 + provider authority |
| Curated public read | `jackpot-site` + accepted DB contract |
| Privacy/operator/legal values | `jackpot-news` / ACQ-05 |
| Cutover/public DOI/DNS | `jackpot-news` release + operators |

Frontend-only evidence may not mark a cross-repo control proven.

### D-S6-03 — Production-equivalent restricted staging first

The acceptance environment must reproduce the production trust shape closely enough to test secrets, workload identity, public-reader access, newsletter persistence, provider interaction, failure behavior, and abuse controls without granting arbitrary previews production mutation authority.

### D-S6-04 — Acquisition stays fail-closed outside controlled test windows

Temporary staging enablement must be time-bounded, use controlled test identities, be restored fail-closed, and be recorded as evidence.

### D-S6-05 — Exact-candidate invariant

S6-H certifies one exact release-candidate SHA.

If runtime/config-affecting remediation changes the candidate after a proof was collected, rerun all affected proofs. Before S6-H, the final candidate must rerun at minimum:

```text
npm test
npm run typecheck
npm run build
guardrail / bundle / secret searches
route inventory
hosted smoke and negative-path checks
```

Evidence from an older candidate may be historical context, not final acceptance.

### D-S6-06 — No invented privacy, analytics, or authority

No placeholder privacy values, GTM-by-convenience, fake hosted OIDC, or production-authority claims.

### D-S6-07 — Rollback never restores legacy acquisition

Rollback is kill switch + deployment rollback + explicit DNS procedure if later needed. Never restore `POST /api/subscribe` or `email_signups`.

### D-S6-08 — Production controls cannot be deferred by packet wording

“Deferred,” “out of repo,” “accepted-with-blocker,” or “works fail-soft” cannot satisfy a required production control unless the relevant authority explicitly classifies it N/A or approves an equivalent control.

### D-S6-09 — Positive and negative proof are both required

For a production dependency, prove the expected working path **and** the safe failure path. Fail-soft alone is not evidence that the product works.

### D-S6-10 — ACQ-06 remains the release-grade final DOI/cutover gate

S6-E is a **controlled staging preflight**, not ACQ-06. ACQ-06 remains responsible for the final release-grade visitor-like lifecycle and GO/NO-GO for public DOI.

## 6. Task sequence

```text
S6-A  release-candidate authority / control freeze
  ↓
S6-B  production-security + full attack-surface inventory
  ↓
S6-C  production-equivalent restricted Vercel topology
  ↓
S6-D  real workload authentication + authorization matrix
  ↓
S6-E  controlled hosted newsletter/provider preflight
  ↓
S6-F  positive + negative hosted public-surface acceptance
  ↓
S6-G  failure / abuse / operational-security / rollback drills
  ↓
S6-H  exact-candidate production-readiness certification
```

S6-C may not waive S6-B.

S6-H requires accepted upstream S5-H and all required S6 acceptance contributions. Work may be performed earlier and recorded as blocked, but the final certification has only two outcomes:

```text
PRODUCTION-READY RELEASE CANDIDATE
BLOCKED
```

## 7. S6-wide prohibitions

1. No `POST /api/subscribe` or `email_signups` fallback.
2. No browser-direct newsletter-service calls or workload assertions.
3. No service-role/admin credential for ordinary public rendering.
4. No ad-hoc Supabase DDL/grant/RLS from this repository.
5. No preview workload with production newsletter mutation authority.
6. No invented Privacy Policy URL/version/operator/contact.
7. No GTM / telemetry sink by convenience.
8. No public DOI enablement solely because staging tests pass.
9. No production DNS/Cloudflare cutover from S6 packets.
10. No deauthorization of the current production frontend.
11. Never commit secret/token/email/assertion values to evidence.
12. No acceptance by deferral wording.
13. No final acceptance based on an older SHA after runtime-affecting remediation.

## 8. Completion definition

S6 may close **PRODUCTION-READY RELEASE CANDIDATE** only when all required controls are proven on the final candidate, including:

- complete route/dependency/env/credential and broader Internet-exposure inventory;
- tests/typecheck/build and guardrails on the exact candidate;
- restricted staging isolated from arbitrary preview production authority;
- browser bundle and server logs free of inappropriate secret/token/PII disclosure;
- OIDC caller and verifier claim matrix proven, including wrong project/environment/audience rejection;
- HA-04 working hosted BFF path;
- HA-05 accepted EB-05 persistence evidence;
- controlled provider preflight and confirmation lifecycle distinct from ACQ-06;
- live curated public read **and** controlled fail-soft path;
- approved privacy/consent behavior;
- approved server-side abuse control + backend cooldown/rate-limit posture;
- malformed/repeated/adversarial input behavior bounded;
- provider/API/database/identity failures bounded and non-leaky;
- request/correlation traceability sufficient for incident investigation without exposing PII/tokens;
- kill switch verified;
- rollback procedure exercised in staging to the extent operationally possible;
- no production authority transfer claimed.

Any required control that is unproven produces **BLOCKED**.

## 9. Relationship to ACQ-06

After a successful S6, ACQ-06 should not discover basic production controls for the first time. It should execute the final release-grade lifecycle and GO/NO-GO:

```text
approved release configuration
→ public-like DOI request
→ authenticated service
→ canonical pending state + consent evidence
→ provider delivery
→ external mailbox
→ confirmation page
→ validate + explicit consume
→ confirmed state
→ webhook/provider reconciliation
→ GO / NO-GO
```

S6 prepares and certifies the candidate. ACQ-06 activates the release decision.
