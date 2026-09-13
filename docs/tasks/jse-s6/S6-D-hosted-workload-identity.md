# S6-D — Hosted workload authentication and authorization

| Field | Value |
|---|---|
| Track | S6-D |
| Type | Hosted caller + verifier acceptance evidence |
| Depends on | S6-C accepted; current EB-03 contract explicitly covers `jackpot-site` |
| Blocks | S6-E…H |
| HA | HA-03 |

## Goal

Prove the real hosted workload trust boundary end to end.

S6-D is not satisfied by “Vercel issued a token.” It must prove that the newsletter verifier accepts the intended `jackpot-site` workload and rejects materially wrong workloads/claims.

## Required authorization contract

The accepted EB-03 companion must define, as supported by the deployed implementation:

- issuer;
- team/account identity;
- `jackpot-site` project identity;
- environment;
- audience/resource binding;
- token lifetime/clock-skew behavior;
- JWKS/key validation behavior.

If EB-03 still names only `rewards-maxxing-frontend`, S6-D is blocked.

## Required proof matrix

At minimum prove:

| Case | Expected |
|---|---|
| accepted jackpot-site staging workload | allowed |
| missing identity | denied before mutation |
| malformed/invalid identity | denied |
| wrong audience/resource | denied |
| wrong Vercel project | denied |
| wrong environment / arbitrary preview | denied |
| expired/not-yet-valid token where testable | denied |
| browser-supplied Authorization/header spoof | cannot become workload authority |

Also verify assertion material is absent from:

- browser responses;
- client bundles;
- telemetry;
- logs/evidence.

## Cross-repo acceptance rule

HA-03 is `proven` only when both caller and verifier evidence exist for the same accepted topology. Frontend evidence alone may complete this packet’s caller work but leaves the acceptance contribution `not-satisfied`.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-D.md` with:

- exact frontend/backend SHAs;
- accepted claim-policy reference;
- authorization matrix;
- redaction/token-hygiene observations;
- packet execution conclusion;
- HA-03 acceptance contribution.

## Acceptance checklist

- [ ] EB-03 explicitly covers jackpot-site
- [ ] Real hosted identity used
- [ ] Positive accepted-workload path proven
- [ ] Wrong project rejected
- [ ] Wrong environment/preview rejected
- [ ] Wrong audience rejected
- [ ] Missing/invalid identity rejected before mutation
- [ ] No assertion leakage
- [ ] Caller and verifier evidence bound to same topology
