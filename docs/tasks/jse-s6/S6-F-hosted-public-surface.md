# S6-F — Hosted public-surface production acceptance

| Field | Value |
|---|---|
| Track | S6-F |
| Type | Hosted positive + negative acceptance evidence |
| Depends on | S6-C accepted; accepted S5-H required for final S6-H |
| Blocks | S6-H |
| Repo | git-ben18/jackpot-site |

## Goal

Prove the actual first-release visitor surface works with real accepted dependencies **and** fails safely when those dependencies are unavailable.

Fail-soft behavior alone cannot pass this packet.

## Required positive proof

On the exact candidate or a traceable ancestor not changed in the relevant runtime path:

- curated discovery successfully reads `api.v_curated_promo_discovery`;
- rendered cards/filters/source links operate on published data;
- no production mock fallback is active;
- ordinary rendering uses accepted least privilege;
- shell/navigation/confirmation surfaces render correctly;
- privacy link/content/version are accepted under ACQ-05/S5-C/S5-H;
- consent/21+ defaults and accepted behavior are correct;
- optional telemetry behavior matches the authorized sink state.

## Required negative proof

Under controlled conditions prove:

- missing/failed curated reader produces visitor-safe fail-soft UX;
- malformed/unavailable upstream data does not expose stacks or raw bodies;
- disabled telemetry emits no optional beacons and does not alter product behavior;
- rejected/unknown consent does not initialize an unauthorized sink;
- source-link/referrer behavior does not leak confirmation tokens or other sensitive values;
- missing optional dependency does not silently substitute mock production data.

## Privacy rule

For final S6 certification, privacy is not an “accepted-with-blocker” row.

If ACQ-05/S5-C/S5-H is unresolved, S6-F may collect other evidence but its overall acceptance contribution remains `not-satisfied` and S6-H is blocked.

Do not author or infer legal values in S6.

## Response-security review

Record hosted observations for applicable:

- CSP/security headers;
- referrer policy;
- cache behavior on token-bearing or sensitive pages;
- error-page disclosure;
- unexpected route/method response behavior.

Route broader defects to S6-G/remediation, but do not ignore them because they originated before S6.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-F.md` with:

- live positive-path observations;
- controlled negative/fail-soft observations;
- privacy/consent evidence;
- telemetry state/evidence;
- hosted response-security observations;
- exact SHA/environment;
- packet execution conclusion + acceptance contribution.

## Acceptance checklist

- [ ] Live curated hosted path succeeds
- [ ] Controlled curated failure fails safely
- [ ] No service-role or production mock fallback
- [ ] Privacy integration accepted
- [ ] Consent/21+ behavior accepted
- [ ] Telemetry disabled or authorized-and-gated as required
- [ ] Applicable headers/referrer/cache/error behavior reviewed
- [ ] Positive and negative proofs both exist
