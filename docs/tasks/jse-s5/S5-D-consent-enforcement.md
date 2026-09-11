# S5-D — Cookie and analytics consent enforcement

| Field | Value |
|---|---|
| Track | S5-D |
| Type | Code + tests + privacy evidence |
| Depends on | S5-A |
| Blocks | S5-F, S5-G |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Implement the first-release consent state and controls so the visitor's choice actually governs non-essential analytics behavior.

A decorative banner is not sufficient. Unknown or essential-only/rejected behavior must prevent non-essential beacons.

If S5-A freezes first-release analytics as entirely disabled, implement only truthful preference/policy behavior required by that decision; do not add a banner that controls nothing.

## State model

Use the S5-A-approved vocabulary. Recommended minimum when optional analytics are retained:

~~~text
unknown
essential_only / rejected
analytics_accepted
~~~

Translate centrally rather than scattering consent booleans through components.

## Required behavior

Before consent, unless upstream authority explicitly classifies an event as necessary:

~~~text
unknown
  -> no optional analytics initialization
  -> no optional analytics network request
~~~

Do not queue raw pre-consent page/token context for later replay.

For essential-only/rejected:

- curated discovery works;
- source links work;
- DOI signup works;
- confirmation works;
- no optional telemetry beacon emits;
- preference persists according to the approved mechanism.

For accepted:

- only S5-E-approved optional analytics may initialize/emit;
- consent does not authorize arbitrary third-party scripts;
- do not retrospectively replay raw/token-bearing context.

For preference change/revocation:

- future optional emissions stop;
- invoke provider-disable seam where available;
- do not promise deletion of historical provider data unless policy/provider authority supports it.

## Persistence requirements

Freeze persistence name/mechanism/lifetime in S5-A.

Requirements:

- first-party and purpose-specific;
- no email/token in preference storage;
- no legacy newsletter signup cookie reused as analytics consent;
- no persistent user/session ID created merely for consent;
- corrupt/unknown value fails to optional-disabled;
- rendering order must not emit before consent is resolved.

## UI requirements

If consent UI is required:

- describe necessary vs optional behavior using approved wording;
- offer explicit reject/essential-only and accept choices;
- link approved Privacy Policy;
- keyboard/screen-reader accessible;
- provide a later way to change preference;
- never condition newsletter access on optional analytics consent.

## Architecture requirement

Provide one narrow consent abstraction, e.g. read/write/canEmit/change-subscription semantics. Telemetry code must use that abstraction rather than parsing cookies independently across components.

## Required tests

At minimum prove:

1. unknown -> zero optional transport calls;
2. rejected/essential-only -> zero optional transport calls;
3. accepted -> approved telemetry seam permitted;
4. revoke -> subsequent optional events suppressed;
5. corrupt persisted value fails safe;
6. preference storage contains no email/token/session ID;
7. newsletter works when analytics rejected;
8. confirmation works when analytics rejected;
9. curated discovery works when analytics rejected;
10. Privacy link resolves;
11. no provider/telemetry request begins before consent;
12. no confirmation-token context is queued pre-consent.

Use a fake/spy transport; no real provider is required.

## DB-W4 boundary

S5-D must not create telemetry schema, RPCs, grants, RLS, retention rules, or persistent identity objects. Consent enforcement is application behavior and can be completed before DB-W4.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-D.md with target SHA, consent decision, state vocabulary, persistence mechanism/name/lifetime, UI paths, no-beacon proof, tests, Privacy linkage, deferred hosted/provider behavior, and accepted/blocked conclusion.

## Out of scope

Telemetry warehouse/schema selection, legacy log-table migration, provider console setup, legal interpretation beyond frozen authority, hosted deployment, and public authority transition.

## Acceptance checklist

- [ ] Consent model matches S5-A.
- [ ] Unknown/rejected emits no optional beacons.
- [ ] Accepted permits only approved telemetry seam.
- [ ] Revocation stops future optional emissions.
- [ ] Preference storage is privacy-minimal.
- [ ] Product UX works with analytics rejected.
- [ ] Privacy linked.
- [ ] No legacy signup/session cookie repurposed.
- [ ] Tests prove behavior, not only banner rendering.
- [ ] No DB/provider production changes performed.

## Agent prompt

~~~text
Implement only S5-D from docs/tasks/jse-s5/S5-D-consent-enforcement.md.
Build the S5-A-approved consent state/control so unknown or essential-only truly
prevents non-essential beacons while all product UX remains usable. Persist only
the minimal preference and support preference changes. Test with fakes. Do not
add telemetry DB schema, provider production config, or deploy.
~~~