# S6-F — Hosted public surface (discovery, privacy, consent)

| Field | Value |
|---|---|
| Track | S6-F |
| Type | Hosted evidence |
| Depends on | S6-C; **ACQ-05 / S5-C** for privacy-acceptance rows |
| Blocks | S6-H privacy / consent / curated hosted rows |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Prove the first-release **public product surface** on restricted staging:

- curated discovery reads `api.v_curated_promo_discovery` with the allowlisted columns and fail-soft empty/error UX (no production mock fallback, no service-role);
- filters / cards / source links work from published data;
- shell Privacy link is `/privacy`;
- consent still defaults unknown; optional telemetry emits zero events unless S6-A recorded a newly authorized sink **and** accepted consent;
- DOI “Privacy Policy” remains unbound until ACQ-05 exists — do **not** “fix” it by linking `/privacy` as if approved.

## Privacy rule

If ACQ-05 / S5-C is still blocked:

- record `/privacy` as scaffold;
- do not author legal text;
- conclude this packet `accepted-with-privacy-blocked` **or** `blocked-pending-policy-authority` for the privacy rows, while curated/consent-zero-beacon rows may still pass.

S6-H cannot call privacy complete on the back of a placeholder.

## Analytics rule

Default: production sink remains `disabled`. Hosted proof is **zero** optional beacons (S5-G first-visit / rejected). Do not add GTM to satisfy “hosted analytics.”

If `jackpot-news` later authorizes a sink, prove S5-D gating on staging without email/token/URL in payloads. That authority must be quoted in S6-A first.

## Evidence

`docs/tasks/jse-s6/_status-S6-F.md`: screenshots or equivalent hosted observations, fail-soft when Supabase reader config is missing, consent/telemetry behavior, privacy freeze, SHA.

## Out of scope

Authoring Privacy Policy, GTM container, DB-W4, DNS, public DOI, event-overlap UI.

## Acceptance checklist

- [ ] Live curated path or honest fail-soft proven on staging
- [ ] No service-role / no mock production fallback
- [ ] Zero optional beacons unless a sink was authorized in S6-A
- [ ] Privacy rows honest vs ACQ-05
- [ ] No invented legal values
- [ ] Not public-site cutover

## Agent prompt

~~~text
Implement only S6-F from docs/tasks/jse-s6/S6-F-hosted-public-surface.md.
Prove hosted curated discovery and consent/telemetry freeze on restricted
staging. Do not invent ACQ-05 privacy URL/version, add GTM, or enable public DOI.
~~~
