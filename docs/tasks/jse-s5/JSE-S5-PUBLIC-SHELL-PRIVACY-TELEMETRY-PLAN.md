# JSE-S5 — Public Shell, Privacy, Consent, and First-Release Telemetry Plan

| Field | Value |
|---|---|
| Slice | `JSE-S5` |
| Repo | `git-ben18/jackpot-site` |
| Type | Implementation-readiness plan + task decomposition |
| Architecture authority | target `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` (`JSE-001`) + source `JSE-003` |
| Product / release / legal authority | `git-ben18/jackpot-news` |
| Upstream implementation | accepted JSE-S3 curated discovery + JSE-S4 newsletter acquisition implementation |
| Program prerequisite | finish/merge S4-H and DB-W3-F/G closeout before freezing the S5 start baseline |
| Status | Planning packet only — no S5 implementation or production authority implied |

## 1. Purpose

JSE-S5 turns the current construction shell into the **intentional first-release public application shell** around the already implemented S3 and S4 capabilities.

S5 does not add another major product surface. It defines what is allowed to exist and execute for every public visitor:

```text
Browser
  ↓
jackpot-site public shell
  ├── approved metadata / brand
  ├── intentional nav
  ├── page content
  │     ├── S4 DOI acquisition
  │     ├── S3 curated discovery
  │     ├── confirmation UX
  │     └── privacy page
  ├── intentional footer/legal links
  └── consent-aware optional telemetry
```

The S5 exit is a production-shaped, privacy-complete, minimally observable local implementation. It is **not** hosted acceptance, production deployment, or public-site authority transfer.

## 2. Source-supported requirements

The following are directly supported by the accepted extraction/product documents and should be treated as S5 invariants.

### Shell

- Root layout is **REIMPLEMENT**, not copied wholesale from the source application.
- Navbar is reimplemented/hardened to only routes that actually exist in the target.
- Footer is reimplemented as a minimal brand/legal surface; legacy acquisition fallback must not return.
- `ExploreFAB` remains excluded unless a separate product decision explicitly restores it.
- Root-layout reachability counts as public dependency reachability.

### Privacy / consent

- `/privacy` must stop being a scaffold before S5 can close.
- Agents must not invent legal/operator/contact/privacy values.
- EC-05A requires the newsletter consent text's **Privacy Policy** link to resolve to the approved policy URL associated with an immutable policy/version record.
- The current upstream release work identifies the final privacy URL/version as a real product/operator gate.
- A cookie banner by itself is not acceptance. If non-essential analytics ship, the visitor's consent decision must actually govern analytics initialization/emission.
- JSE-003 exit language is explicit: essential-only behavior must prevent non-essential beacons.

### Telemetry

Initial candidate public-event taxonomy from JSE-001:

```text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
```

Additional invariants:

- subscribe-requested is not subscription-confirmed;
- a generic/non-enumerating subscribe success must never be counted as confirmation;
- raw email, confirmation token, workload identity, provider secrets, or backend error bodies must not enter analytics;
- confirmation-token scrubbing must remain intact;
- analytics failure must never break curated discovery, newsletter acquisition, or confirmation UX;
- session identity is not required unless an approved measurement requirement proves it is needed;
- unrelated legacy dashboard/session telemetry must not be migrated merely because a helper exists.

## 3. Important unresolved decisions

S5-A must resolve or explicitly block on the following. Agents may not silently choose for the product.

| Decision | Current evidence / safe default |
|---|---|
| Final Privacy Policy URL and immutable version | **Human/product input required.** Current upstream release docs say these values must not be invented. |
| Exact production Privacy Policy content/contact/operator values | Must come from `jackpot-news` / operator-approved source. Target placeholder is not authority. |
| Footer DOI placement in v1 | JSE-003 leaves homepage-only vs homepage+footer unresolved. **Default target should remain homepage-only unless explicit approval exists.** |
| `/terms` route/link | Optional. Do not add it unless approved content is actually shipping. |
| Analytics v1 activation | JSE-003 leaves omit vs consent-gated GTM open. S5 must freeze whether first release has an active sink or a contract/disabled-by-default implementation. |
| Telemetry provider / durable sink | Must be identified by authority or deferred. **S5 must not invent a Supabase telemetry schema.** |
| Session ID | Omit by default. Add only if the approved measurement contract requires it. |
| Cookie UI | Required only to the extent needed to express/enforce the chosen consent model; do not ship a decorative banner. |

## 4. Proposed S5 planning decisions to freeze

These are the recommended target decisions for S5-A. They are intentionally conservative and preserve JSE-001/JSE-003 trust cuts.

### D-S5-01 — Minimal shell allowlist

The first-release root shell contains only:

```text
metadata / document language
global CSS / approved fonts
header / brand / allowed nav
<main>{children}</main>
footer / approved legal links
consent control only if needed by the accepted telemetry policy
```

No source root provider/control is inherited by transitive copy.

### D-S5-02 — Small route-visible navigation

Allowed first-release public navigation is limited to routes already accepted for the target:

```text
/
/privacy
```

`/newsletter/confirm` is a flow route, not a primary navigation destination.

Do not add Discover, Snapshots, Dashboard, Blog, Terms, Explore, account, or legacy newsletter routes without an explicit product decision and implemented route.

### D-S5-03 — No footer signup by inference

Do not add a second DOI form to the footer merely because the source had one. Homepage DOI remains sufficient unless product authority explicitly accepts footer acquisition for first release.

### D-S5-04 — Privacy is authoritative content, not target-authored legal policy

`jackpot-site` may implement the route, layout, rendering, and tests. It may not invent the legal/operator facts required to populate the policy.

S5-C is blocked from acceptance until the approved content/URL/version inputs exist.

### D-S5-05 — Consent is behavioral

For any non-essential analytics:

```text
unknown / essential-only / rejected
  -> zero non-essential analytics network emission

accepted
  -> only approved first-release events may emit

revoked
  -> future optional emission stops
```

Newsletter and curated-promo UX continue to work when analytics are rejected.

### D-S5-06 — First-release event allowlist

Only events explicitly frozen by S5-E may exist in the public emitter. Unknown event names or arbitrary metadata are rejected by type/schema rather than forwarded.

The JSE-001 seven-event list is the maximum initial candidate set unless S5-A records a newer product authority.

### D-S5-07 — DOI analytics semantics

`newsletter_subscribe_requested` represents a successful **public request acceptance** by the target BFF contract. It never means confirmed subscriber.

`newsletter_subscription_confirmed` may emit only from an approved terminal confirmation outcome, never from the generic subscribe response.

S5-E must map the exact S4 confirmation statuses before implementation.

### D-S5-08 — Privacy-minimized payloads

Default prohibited fields:

```text
email / email hash
confirmation token
full page URL with query/fragment
referrer containing token/query data
IP supplied by application code
user agent supplied by application code
workload/OIDC assertion
backend/provider message
stack trace
arbitrary metadata object
legacy access/reward token
```

Do not add a stable session/user identifier unless the measurement requirement explicitly needs one.

### D-S5-09 — Telemetry storage/schema is not an S5 migration

S5 defines frontend event semantics, consent behavior, and the application telemetry seam.

It does **not** create a Supabase telemetry schema, migrate `session_logs` / `interaction_logs` / `click_logs`, expand anonymous grants, or reproduce the legacy telemetry persistence model.

Any durable Supabase telemetry-domain decision belongs to the later DB-W4 design unless a higher authority explicitly changes that boundary.

### D-S5-10 — No legacy tracker migration by convenience

Do not copy `SessionInit`, `useTracker`, `/api/log-session`, `/api/log-interaction`, or `/api/log-click` merely to obtain analytics quickly.

Reuse of any legacy implementation requires S5-A/E to explicitly approve its narrowed contract and consent/storage boundary. The default is reimplementation from the new allowlist.

### D-S5-11 — Analytics fail soft

Telemetry must be best-effort. Network/provider/serialization failure must not alter the visitor-facing success/failure state of:

- curated discovery;
- filter/card/detail interaction;
- source-link navigation;
- DOI request;
- confirmation.

### D-S5-12 — S5 does not transfer production authority

A production-shaped shell and locally accepted telemetry contract do not authorize:

- Vercel production/staging acceptance;
- production OIDC;
- production Supabase newsletter mutation;
- real SendGrid;
- Cloudflare/DNS cutover;
- public DOI enablement;
- production analytics/provider acceptance;
- public-site authority transfer.

## 5. Task decomposition

```text
S5-A  baseline + authority / policy freeze
  ↓
S5-B  public shell allowlist implementation
  ↓
S5-C  Privacy Policy integration
  ↓
S5-D  consent model + enforcement
  ↓
S5-E  first-release telemetry contract
  ↓
S5-F  telemetry implementation + security guardrails
  ↓
S5-G  local integration acceptance
  ↓
S5-H  implementation closeout
```

S5-C and S5-D may be developed in parallel after S5-A if their policy inputs are frozen. S5-F must not start until S5-D and S5-E are accepted.

## 6. S5-wide prohibitions

Every S5 task must preserve these boundaries:

1. No `SUPABASE_SERVICE_ROLE_KEY` or generic admin client for shell/analytics.
2. No `POST /api/subscribe`.
3. No legacy `email_signups` writer or reward/access-token behavior.
4. No `SessionInit` migration by default.
5. No `ExploreFAB` by default.
6. No legacy dashboard/Hottest Offers/event-dashboard routes.
7. No raw/canonical Supabase promo-table access; S3 remains on its accepted public contract.
8. No newsletter service hostname or workload identity in browser code.
9. No confirmation token in analytics/logging/referrer after page bootstrap.
10. No invented privacy/operator/contact/version values.
11. No telemetry DB DDL/grant/RLS migration from `jackpot-site`.
12. No deployment or production-authority claim.

## 7. S5 completion definition

S5 may close as **IMPLEMENTATION COMPLETE** only when:

- the shell is intentionally allowlisted;
- construction-only user-facing shell copy is removed or replaced with approved public copy;
- no accidental legacy global dependency remains;
- `/privacy` contains approved production-intent content and an identifiable approved version;
- DOI surfaces link to that approved Privacy Policy as required;
- optional analytics are behaviorally governed by consent;
- the first-release event taxonomy/payload/trigger contract is frozen;
- requested vs confirmed newsletter analytics are distinct;
- PII/token/secret hygiene is tested;
- telemetry failure is non-blocking;
- tests/typecheck/build and repository guardrail searches pass;
- the closeout explicitly distinguishes local implementation from hosted/provider/public acceptance.

If the approved privacy content/URL/version do not exist, S5-H must not call the slice complete. Record the blocker rather than filling it with placeholders.
