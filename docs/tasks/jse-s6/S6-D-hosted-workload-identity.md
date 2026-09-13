# S6-D — Hosted workload identity (real OIDC caller)

| Field | Value |
|---|---|
| Track | S6-D |
| Type | Hosted proof + cross-repo handoff |
| Depends on | S6-C accepted; `jackpot-api-newsletter` EB-03 / Epic B freeze for audience/claims |
| Blocks | S6-E |
| Estimate | L |
| Repo | git-ben18/jackpot-site (caller evidence only) |
| HA | HA-03 |

## Goal

Prove the **caller** side of ADR-0003 on restricted staging: `jackpot-site` BFF acquires a real Vercel-issued workload identity and attaches it only on the server. Missing/wrong identity fails closed before newsletter side effects.

Verifier acceptance (which project/environment claims are trusted) belongs to `jackpot-api-newsletter`. This packet records a handoff; it does not rewrite backend authorization policy from the frontend repo.

S4-D local/fake proofs are **not** this packet.

## Requirements

1. Staging `jackpot-site` uses Vercel OIDC (not fake mode).
2. Audience/`NEWSLETTER_WORKLOAD_OIDC_AUDIENCE` matches the EB-03 freeze — do not invent an audience.
3. Protected BFF paths do not call the newsletter service when identity is unavailable.
4. Browser cannot supply `Authorization` that becomes workload authority (already S4-D; re-prove on staging if a test exists).
5. Assertion material never appears in browser responses, client bundles, or telemetry.
6. Record companion verifier evidence **or** mark HA-03 verifier leg `blocked-pending-newsletter-epic-B` rather than claiming full HA-03.

## Evidence

`docs/tasks/jse-s6/_status-S6-D.md`:

- identity mode on staging (names only);
- SHA;
- fail-closed proof (unauthorized / missing token);
- authorized caller proof **only if** the verifier side is actually accepting this project/env;
- distinction: configured vs provider-accepted vs production-authoritative (the last must remain false).

## Out of scope

SendGrid, DNS, public DOI, production trust-config ACQ-03 cutover, HA-05 DDL, analytics provider.

## Acceptance checklist

- [ ] Fake identity not used on staging
- [ ] Audience taken from EB-03, not invented
- [ ] Missing identity fails before mutation
- [ ] No assertion leakage
- [ ] Verifier leg proven **or** honestly blocked
- [ ] Not production authorization

## Agent prompt

~~~text
Implement only S6-D from docs/tasks/jse-s6/S6-D-hosted-workload-identity.md.
Prove real Vercel OIDC on restricted staging for the jackpot-site caller.
Do not invent EB-03 audience, claim backend verifier acceptance without
newsletter-repo evidence, enable public DOI, or treat this as production trust.
~~~
