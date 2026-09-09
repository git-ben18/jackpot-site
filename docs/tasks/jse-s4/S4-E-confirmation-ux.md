# S4-E — Confirmation UX

| Field | Value |
|---|---|
| Track | S4-E |
| Type | Code + tests |
| Depends on | S4-A, S4-C |
| Blocks | S4-G |
| Estimate | M |
| Repo | `git-ben18/jackpot-site` |

## Goal

Replace the current placeholder newsletter confirmation route with a production-shaped, locally testable confirmation experience that uses only the target same-origin BFF and the frozen canonical confirmation-state contract.

S4-E implements UX and token-handling behavior. It does not require hosted newsletter-service connectivity, real confirmation mutation, real SendGrid traffic, or public deployment.

## Target flow

```text
visitor opens /newsletter/confirm?...token...
   ↓
page extracts token using approved method
   ↓
same-origin confirm/validate BFF
   ↓
render bounded validation state
   ↓
user confirmation action when required
   ↓
same-origin confirm BFF
   ↓
render bounded final state
```

The browser must never call `jackpot-api-newsletter` directly.

## Token hygiene

1. Treat confirmation tokens as secrets/credentials for a narrow action.
2. Never log the token.
3. Never render the raw token in visible UI.
4. Do not copy token values into analytics events, error telemetry, localStorage, sessionStorage, or long-lived cookies.
5. Avoid retaining the token in client state longer than necessary.
6. Prefer URL cleanup/replacement after token extraction when compatible with the product and framework behavior, so the token is not unnecessarily retained in address-bar history/referrer propagation.
7. Do not place confirmation tokens in outbound links.
8. Do not expose raw backend token diagnostics.

## Confirmation-state contract

Use S4-A's frozen backend/product vocabulary. The implementation must map canonical states exhaustively to a smaller browser-safe product state set.

Expected backend semantics may include states in the family of:

```text
ready_to_confirm
already_complete
invalid_or_unusable
unable_to_confirm
success
```

Do not assume these exact strings without S4-A verification. Unknown states, malformed responses, or unexpected successful HTTP payloads must fail closed to a generic safe error/unavailable state.

## Required UI states

At minimum design and test bounded states for:

- initial/loading;
- ready to confirm;
- confirming/in-flight;
- confirmed/success;
- already complete;
- invalid/unusable link;
- temporarily unable to validate/confirm;
- generic unexpected failure.

The UI must not reveal subscriber-specific state beyond approved product semantics.

## Implementation requirements

1. Replace placeholder confirmation copy with the actual S4 confirmation flow.
2. Use the S4-C same-origin browser client/BFF contract only.
3. Keep validation and confirmation as distinct operations if that is the frozen canonical service behavior.
4. Never interpret an unknown `2xx` response as `ready` or `success`.
5. Handle already-complete/idempotent behavior as an approved final state without exposing historical subscriber details.
6. Use bounded local copy keyed by sanitized status; do not render arbitrary backend messages.
7. Disable/deduplicate repeated confirmation actions while a mutation is in flight.
8. Preserve accessible focus, status announcements, and retry behavior.
9. Ensure failure states cannot accidentally fall back to legacy subscriber state or another signup endpoint.
10. Keep the page functional with a fake/local BFF transport for S4-G integration tests.

## Error/privacy semantics

- Invalid/unusable token should not distinguish why the token failed unless product authority explicitly permits it.
- Backend unavailable should be a generic retry-safe failure, not a stack/provider/database error.
- Unauthorized workload identity failures from the downstream service should never surface OIDC claims or configuration details to the visitor.
- No user email or subscriber record should be rendered unless explicitly required by product authority and returned through an approved browser-safe contract.

## Required tests

At minimum cover:

1. missing token → bounded invalid-link state without network mutation;
2. valid-looking token invokes only same-origin validation;
3. ready state exposes the approved confirm action;
4. confirmation action calls only same-origin confirm route;
5. success renders confirmed state;
6. already-complete renders approved idempotent final state;
7. invalid/unusable renders generic safe state;
8. unknown backend/BFF status fails closed;
9. malformed response fails closed;
10. repeated click/in-flight request is controlled;
11. raw token is absent from logs and rendered text;
12. no direct newsletter-service hostname exists in browser confirmation code;
13. no legacy `/api/subscribe` or local subscriber writer is used.

## Evidence / deliverables

- Production-shaped `/newsletter/confirm` route/page.
- Confirmation browser client if not already supplied by S4-C.
- Bounded state mapper.
- Token-hygiene helper if warranted.
- Focused route/component tests.
- Provenance/status evidence recording source-derived behavior and intentional hardening.

## Hosted Acceptance handoff

The future Hosted Acceptance layer must separately prove:

- a real confirmation link generated by controlled staging newsletter flow reaches the staging `jackpot-site` confirmation page;
- staging BFF authenticates to staging newsletter service;
- token validation/consume succeeds end-to-end;
- wrong/missing workload identity fails before mutation;
- real SendGrid confirmation-link behavior is accepted under controlled conditions.

None of those are S4-E completion requirements.

## Out of scope

- Real SendGrid email generation/delivery.
- Hosted token validation/consume.
- Vercel deployment/OIDC acceptance.
- Supabase mutation/grant/RLS changes.
- Production hostname/DNS.
- Analytics not already approved for token-safe confirmation behavior.
- Public DOI enablement.

## Acceptance checklist

- [ ] Placeholder route is replaced with bounded confirmation UX.
- [ ] Validation and confirmation use same-origin BFF only.
- [ ] Token hygiene requirements are enforced/tested.
- [ ] Known canonical states map exhaustively to browser-safe states.
- [ ] Unknown/malformed successful responses fail closed.
- [ ] Already-complete behavior is safe/idempotent.
- [ ] No raw backend message or subscriber enumeration is exposed.
- [ ] No legacy writer/fallback exists.
- [ ] Focused confirmation tests pass.
- [ ] No deployment or real confirmation mutation is required/performed.

## Agent prompt

```text
Implement only S4-E from docs/tasks/jse-s4/S4-E-confirmation-ux.md.
Replace the placeholder confirmation page with token-hygienic, bounded UX using
only same-origin validate/confirm BFF routes. Exhaustively map the frozen status
contract and fail closed on unknown responses. No hosted E2E, real email, or
deployment.
```
