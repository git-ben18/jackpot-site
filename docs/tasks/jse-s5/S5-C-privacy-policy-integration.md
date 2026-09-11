# S5-C — Privacy Policy integration

| Field | Value |
|---|---|
| Track | S5-C |
| Type | Approved content integration + tests + policy evidence |
| Depends on | S5-A |
| Blocks | S5-G, S5-H |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Replace the /privacy scaffold with the approved first-release Privacy Policy and bind the public route/version/linkage to authoritative ACQ-05 / EC-05A inputs.

This task may implement approved presentation and linkage mechanics. It may not author missing legal/operator facts.

S5-C cannot conclude accepted while required policy values remain unknown or placeholders.

## Preconditions

S5-A must identify:

~~~text
approved privacy route/URL
approved privacy-policy version
approved policy content or canonical source
approved operator/business identity where required
approved public contact method where required
approved consent-policy linkage
~~~

If any required value is missing, route/component preparation may proceed, but _status-S5-C.md must conclude blocked-pending-policy-authority.

## Binding requirements

Upstream guidance requires:

- actual approved Privacy Policy URL;
- immutable privacy-policy version;
- EC-05A consent text linking the words Privacy Policy to the approved policy;
- rendered page corresponding to the approved version;
- no agent-invented substitute for missing URL/version/operator approval.

## Required content audit

Compare the approved policy against actual target behavior:

- curated promo discovery;
- newsletter email/consent/age input through same-origin BFF;
- confirmation token handling;
- cookies/local storage actually used;
- S5-D consent behavior;
- S5-E/F telemetry behavior;
- external provider categories actually used;
- outbound source links.

Do not copy legacy statements about session, UTM, or usage cookies when the target does not implement those behaviors.

## Implementation requirements

1. Replace placeholder /privacy content with approved policy content.
2. Expose the approved privacy-policy version as required by S5-A.
3. Keep route/link behavior aligned to the approved production privacy URL strategy.
4. Bind every first-release DOI Privacy Policy link to the same approved destination.
5. Do not rewrite fixed EC-05A consent copy merely for implementation convenience.
6. Ensure S5-D/E cookie/analytics wording and runtime behavior agree with the policy.
7. Do not retain a /terms link unless Terms is separately approved and shipped.
8. Do not expose internal registry/database details unnecessarily.
9. Do not log or emit visitor email/token through policy interactions.
10. Record policy source repo/path/SHA/version in evidence.

## Policy change-management evidence

Record, without inventing legal interpretation:

- canonical content owner;
- version-increment mechanism;
- relationship between privacy version and newsletter consent-policy version;
- any unresolved rule for material vs editorial change;
- operator/product decision owner for that unresolved rule.

## Required tests

At minimum:

- /privacy renders no placeholder/TODO copy;
- approved version identifier is present as required;
- shell Privacy link resolves;
- all DOI Privacy Policy links resolve to the approved target;
- no stale placeholder URL/version remains;
- no unapproved /terms link remains;
- privacy rendering itself does not initialize analytics;
- no token-bearing query data enters telemetry;
- production build succeeds.

## Evidence output

Create docs/tasks/jse-s5/_status-S5-C.md containing target SHA, policy authority repo/path/SHA, approved URL/version, consent-policy linkage, target paths, tests, unresolved product/legal items, and conclusion accepted or blocked-pending-policy-authority.

## Stop conditions

Stop rather than invent if:

- final URL/version is unknown;
- content is draft/unapproved;
- required operator/contact information is missing;
- EC-05A wording and proposed linkage conflict;
- approved policy contradicts actual target behavior;
- completion appears to require deployment/public enablement.

## Out of scope

Legal advice, unsupported policy drafting, core consent-registry DB changes, S5-D consent implementation, S5-E/F telemetry implementation, hosted reachability proof, and production enablement.

## Acceptance checklist

- [ ] Approved policy source identified.
- [ ] URL and immutable version are non-placeholder values.
- [ ] /privacy renders approved content.
- [ ] EC-05A Privacy Policy link resolves correctly everywhere.
- [ ] Cookie/analytics statements match actual S5 behavior.
- [ ] Legacy-only cookie/session claims were not copied.
- [ ] Terms appears only if approved.
- [ ] Tests pass and policy/version evidence recorded.
- [ ] No agent-invented legal/operator value is present.

## Agent prompt

~~~text
Implement only S5-C from docs/tasks/jse-s5/S5-C-privacy-policy-integration.md.
Replace the /privacy scaffold only from S5-A-approved policy content, URL, and
version and bind the EC-05A Privacy Policy link consistently. Audit policy copy
against actual target cookies/analytics behavior. If authority is missing,
record BLOCKED-PENDING-POLICY-AUTHORITY; do not invent values or enable production.
~~~