# S6-G — Failure, abuse, operational security, and rollback

| Field | Value |
|---|---|
| Track | S6-G |
| Type | Hosted adversarial/failure evidence + operational drills |
| Depends on | S6-C; relevant S6-D/E/F paths available |
| Blocks | S6-H |
| HA | HA-07 |

## Goal

Prove the release candidate remains bounded, non-leaky, and recoverable under realistic Internet abuse and dependency failure.

A honeypot plus documentation is not enough for production readiness.

## Required abuse-control posture

Before S6-H, public acquisition must have one of:

1. Turnstile or the approved production challenge/control implemented and proven server-side; or
2. a specifically approved equivalent temporary production control with:
   - approving authority;
   - compensating controls;
   - rate/cooldown/circuit-breaker behavior;
   - monitoring/response owner;
   - expiry/review date.

Bare “Turnstile deferred” is `not-satisfied`.

## Required adversarial/failure scenarios

Where applicable to current routes, prove bounded behavior for:

- rapid/repeated subscribe attempts;
- honeypot/challenge failure;
- malformed JSON/form input;
- oversized input/body behavior;
- unexpected HTTP methods/content types;
- browser-supplied auth/header spoofing;
- wrong workload project/environment/audience;
- newsletter API timeout/5xx/unavailable;
- Supabase/public-reader timeout/error;
- provider failure/suppression where backend evidence owns the proof;
- analytics/provider failure if any sink exists;
- confirmation replay/invalid/already-complete;
- token/email/assertion log-redaction checks;
- application error paths without stack/upstream-body disclosure.

## Rate-limit dependency rule

S6-A/B/G must explicitly review the actual backend public-action-limit failure posture.

If the backend limiter can fail open on dependency/exception paths, production readiness requires an accepted compensating architecture or backend remediation. Do not assume rate limiting exists merely because the happy-path RPC is present.

## Operational traceability

Prove there is enough safe traceability to investigate failures without relying on product analytics:

- request/correlation identifier or equivalent;
- frontend/backend/provider linkage where supported;
- no raw email, confirmation token, workload assertion, or secret in logs/evidence.

If adequate correlation does not exist, record remediation/blocker rather than adding invasive analytics.

## Kill switch

With acquisition unset/false, prove mutation is blocked from the hosted BFF.

After any temporary test enablement, prove the environment returned fail-closed.

## Rollback/recovery drill

Record and **exercise in staging where operationally possible**:

1. disable acquisition;
2. verify mutation stops;
3. roll back/redeploy to a known prior Vercel deployment or execute the approved safe simulation if provider policy prevents a destructive drill;
4. verify public read/fail-safe behavior after rollback;
5. record DNS revert procedure only if later cutover requires it;
6. never restore `/api/subscribe` or `email_signups`.

## Broader Internet-exposure review

Revisit S6-B findings after hosted deployment. Capture any runtime-only behavior that local analysis missed, including headers, redirects, caching, platform error pages, bot/automation behavior, and provider-specific responses.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-G.md` with:

- abuse-control implementation/approved equivalent;
- adversarial/failure matrix;
- rate-limit posture;
- redaction/correlation evidence;
- kill-switch proof;
- rollback/recovery drill evidence;
- hosted runtime-only findings;
- exact SHAs/environments;
- HA-07 acceptance contribution.

## Acceptance checklist

- [ ] Production abuse control implemented/proven or equivalent explicitly approved
- [ ] Repeated/malformed/oversized/unexpected requests bounded
- [ ] Identity/upstream/provider failures bounded and non-leaky
- [ ] Backend rate-limit failure posture accepted
- [ ] PII/token/assertion log redaction checked
- [ ] Safe incident correlation exists
- [ ] Kill switch blocks mutation
- [ ] Rollback/recovery exercised in staging where possible
- [ ] No legacy writer in rollback
- [ ] Hosted runtime-only exposure review completed
