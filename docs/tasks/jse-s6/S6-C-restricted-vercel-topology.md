# S6-C — Production-equivalent restricted Vercel topology

| Field | Value |
|---|---|
| Track | S6-C |
| Type | Hosted configuration + positive/negative isolation evidence |
| Depends on | S6-A accepted; S6-B accepted; readiness review permitted |
| Blocks | S6-D…H |
| Repo | git-ben18/jackpot-site |
| HA | HA-01, HA-02 |

## Goal

Stand up the intentional restricted acceptance environment that mirrors the production trust shape closely enough to certify the release candidate without exposing public production authority.

An arbitrary preview is not acceptance staging.

## Requirements

1. Named restricted staging/acceptance environment.
2. Exact candidate SHA deployed.
3. Explicit Preview / Staging / Production configuration matrix.
4. Secret values remain provider-managed and never appear in evidence.
5. Acquisition fail-closed except controlled S6-E windows.
6. Preview deployments cannot obtain production newsletter mutation authority.
7. Preview deployments cannot inherit production-only secrets merely because they are part of the same Vercel project.
8. Fake workload identity is impossible for hosted acceptance and production-shaped environments.
9. No service-role credential on the site for ordinary rendering.
10. Curated public-reader config uses accepted least privilege.
11. Restricted environment is not treated as the public product hostname.
12. Any perimeter/access restriction used for acceptance is documented so it cannot be mistaken for an application-layer production control.

## Required negative proof

Do not accept a declarative “environments are isolated” statement alone.

Provide evidence that, without exposing values:

- a preview does **not** receive/resolve production-only secret names where policy requires absence;
- preview cannot successfully perform the production/staging newsletter mutation path;
- fake identity cannot be enabled in a hosted production-shaped environment;
- the acceptance deployment cannot accidentally use an unapproved production upstream;
- acquisition remains blocked when the feature flag is unset/false.

## Evidence output

`docs/tasks/jse-s6/_status-S6-C.md` must include:

- Vercel project/environment names;
- deployed SHA;
- configuration-name matrix (no values);
- positive staging configuration proof;
- negative preview/isolation proof;
- kill-switch state before/after;
- what remains intentionally absent: public DNS, public DOI, authority transfer.

## Stop conditions

Block if:

- S6-B is not accepted;
- readiness review is not permitted;
- a preview requires production mutation authority “for testing”;
- acceptance relies on secret values pasted into docs;
- the topology cannot distinguish preview from accepted staging.

## Acceptance checklist

- [ ] S6-B accepted; no waiver
- [ ] Production-equivalent restricted staging exists
- [ ] Exact candidate SHA deployed
- [ ] Preview/staging/prod configuration matrix recorded
- [ ] Negative isolation proof recorded
- [ ] Kill switch fail-closed outside controlled windows
- [ ] No service-role ordinary-rendering credential
- [ ] No DNS/public-authority claim
