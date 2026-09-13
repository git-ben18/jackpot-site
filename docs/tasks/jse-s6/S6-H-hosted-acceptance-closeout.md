# S6-H — Production-readiness certification

| Field | Value |
|---|---|
| Track | S6-H |
| Type | Final exact-candidate evidence / release handoff |
| Depends on | Accepted S5-H and S6-A…G required acceptance contributions |
| Blocks | ACQ-06 and production cutover decision |
| HA | HA-08 |

## Goal

Certify one exact `jackpot-site` release candidate as production-ready, or block release.

There is no “hosted acceptance complete with required production blockers” outcome.

Allowed final statuses:

```text
PRODUCTION-READY RELEASE CANDIDATE
BLOCKED
```

## Exact-candidate invariant

Record:

- final `jackpot-site` candidate SHA;
- exact `jackpot-api-newsletter` SHA used by accepted hosted proofs;
- acceptance environment pair;
- authority/config references;
- evidence date.

If runtime/config-affecting remediation occurred after earlier proofs, identify affected evidence and rerun it.

On the final candidate rerun at minimum:

```text
npm test
npm run typecheck
npm run build
guardrail searches
browser-bundle / secret scan
route/method inventory comparison
hosted smoke checks
critical negative-path checks
```

A final SHA that has not undergone these checks cannot be certified.

## Required closeout statement

```text
JSE-S6 — Production Readiness and Security Acceptance

STATUS: <PRODUCTION-READY RELEASE CANDIDATE | BLOCKED>

jackpot-site candidate SHA:
newsletter backend SHA:
acceptance environment:
acceptance date:

Required controls:
- production route/dependency/env/credential/attack-surface audit
- production-equivalent restricted hosting and preview isolation
- OIDC authentication + authorization matrix
- hosted BFF contract
- accepted HA-05 / EB-05 persistence proof
- controlled provider preflight
- live curated public path + negative fail-soft path
- accepted privacy/consent behavior
- accepted abuse/rate-limit posture
- failure/redaction/correlation evidence
- kill-switch proof
- rollback/recovery drill
- final candidate regression/build/security checks

Not asserted by S6:
- public DOI enabled
- production DNS/Cloudflare cut over
- public-site authority transferred
- legacy frontend deauthorized
- ACQ-06 GO decision completed
```

## Required evidence table

Use `proven | N/A-by-authority | not-satisfied` for acceptance contributions.

Required areas include:

- routes/methods/framework surfaces;
- dependencies/supply chain;
- browser bundles;
- newsletter contract;
- workload identity/authorization;
- Supabase public read;
- newsletter persistence;
- secrets/env isolation;
- privacy;
- consent/cookies/analytics;
- abuse/rate limits;
- curated public path;
- malformed/adversarial input;
- failure/error disclosure;
- logs/redaction/correlation;
- response headers/referrer/cache;
- Vercel preview/staging/prod isolation;
- provider path;
- kill switch;
- rollback/recovery.

A required `not-satisfied` row forces `BLOCKED`.

## Mandatory blocker rule

S6-H must be `BLOCKED` if any required control is unproven, including:

- S5-H not accepted;
- ACQ-05/privacy incomplete;
- stale/unaccepted `jackpot-site` verifier policy;
- HA-05/EB-05 missing;
- required provider preflight missing;
- approved abuse control missing;
- unresolved material dependency/security finding;
- rate-limit/failure posture not accepted;
- secret/token/PII leakage;
- rollback unproven;
- final candidate SHA changed without rerunning affected acceptance.

## Relationship to ACQ-06

Successful S6-H means the candidate is technically and operationally ready to enter final release acceptance.

ACQ-06 still owns the release-grade DOI lifecycle and GO/NO-GO for public enablement. S6-H must not claim that ACQ-06 occurred.

## Acceptance checklist

- [ ] Final exact candidate SHA recorded
- [ ] Accepted S5-H present
- [ ] All required S6 acceptance contributions proven/N/A-by-authority
- [ ] Final tests/typecheck/build/guardrails rerun
- [ ] Critical hosted positive/negative checks bound to final candidate
- [ ] No required control remains deferred
- [ ] Final status is exactly production-ready or blocked
- [ ] No DNS/public DOI/authority-transfer claim
