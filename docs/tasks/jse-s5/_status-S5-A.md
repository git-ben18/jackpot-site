# S5-A status — baseline, authority, and policy freeze

| Field | Value |
|---|---|
| Date | 2026-09-10 |
| Packet | [S5-A-baseline-authority-policy-freeze.md](./S5-A-baseline-authority-policy-freeze.md) |
| Plan | [JSE-S5-PUBLIC-SHELL-PRIVACY-TELEMETRY-PLAN.md](./JSE-S5-PUBLIC-SHELL-PRIVACY-TELEMETRY-PLAN.md) |
| Result | **accepted** — docs/analysis freeze only, with recorded program exceptions |
| Inspected `main` tip / S5 start SHA | `jackpot-site@3bd1fe0347ace48d7a9ab8fdddb80cca066999f5` (`3bd1fe0`) |
| Inventory | [s5-shell-and-global-runtime-inventory.md](./s5-shell-and-global-runtime-inventory.md) |
| Telemetry template | [s5-telemetry-contract-template.md](./s5-telemetry-contract-template.md) |

This freeze replaces historical planning SHAs with values inspected when this packet ran. Later S5 packets must use these decisions; they must not invent legal values, copy `SessionInit` / generic trackers, create telemetry DB objects, deploy, or configure providers.

S5-A performed **no runtime or production changes**.

---

## Program exceptions (explicit)

S5-A Depends-on allows an exception for DB-W3-F/G. S4-H closeout is authored but unmerged. Runtime lineage is still a main descendant of merged S3-H and S4-G.

| ID | Gap | Exception |
|---|---|---|
| EX-S5-A-01 | S4-H closeout not on `main` | S5 start is `main@3bd1fe0`, descendant of S4-G merge `359ecfb` (PR #24) and S3-G/H merge `47c911c` (PR #25). Unmerged closeout lives at `origin/docs/jse-s4-h-implementation-closeout@1f16ef6`. S5-A does not merge that branch. S4 **runtime** lineage is not unclear. Merge S4-H separately; this packet does not substitute for it. |
| EX-S5-A-02 | DB-W3-F/G not closed | S5 consumes only the already-accepted W3-E contract `api.v_curated_promo_discovery`. Public-view retirement is out of S5 scope. Do not reopen DB-W3 migrations from this repo. |

---

## Frozen SHAs

### jackpot-site

| Item | SHA / status |
|---|---|
| S5 start (`main` HEAD) | `3bd1fe0347ace48d7a9ab8fdddb80cca066999f5` — Merge PR #27 (S5 task packets) |
| Contains S5 planning docs | PR #26 `4d128af` + PR #27 `3bd1fe0` |
| S3-G/H merge | `47c911c` Merge PR #25; implementation commit `3a6b66e` |
| S3-H evidence | [`_status-S3-H.md`](../jse-s3/_status-S3-H.md), [`docs/evidence/jse-s3-closeout.md`](../../evidence/jse-s3-closeout.md) |
| S4-G merge | `359ecfb` Merge PR #24 |
| S4-G tested runtime | `6871c6c354441eec270831e05b2086413931b732` |
| S4-A freeze (historical) | recorded in [`_status-S4-A.md`](../jse-s4/_status-S4-A.md) |
| S2 baseline (historical) | `main@7abb209f7bafd0da53d08027e5773eff272fa39a` |
| Unmerged S4-H evidence | `1f16ef6` on `docs/jse-s4-h-implementation-closeout` — **not** an S5 start SHA |

Current first-release routes on this SHA: `/`, `/privacy` (scaffold), `/newsletter/confirm`, plus the three newsletter BFF POSTs. Homepage mounts S4 DOI hero then S3 curated discovery.

### jackpot-news

Inspected via GitHub API against default branch `main` (no local clone in this environment). Tip **unchanged** since S4-A.

| Authority | SHA inspected | Notes |
|---|---|---|
| `jackpot-news` `main` | `5bba8b11bf424734ede5eda44e8f5687ca3117d1` | 2026-08-30; ADR-0004 merge PR #10 |
| ADR-0003 | same | Hosting + Vercel OIDC; browser never calls newsletter-service hostname |
| ADR-0004 | same | Target public-site repo is `jackpot-site`; production authority remains gated on acceptance/cutover |
| Decisions present | ADR-0001..0004 only | No newer accepted analytics/privacy ADR at this tip |
| EC-05A | same SHA; content as frozen in S4-A | [`_status-S4-A.md`](../jse-s4/_status-S4-A.md) product-owned values |
| ACQ-05 | same SHA; still unresolved | Privacy URL/version not in any accepted ADR at this tip |

No newer accepted `jackpot-news` analytics, GTM, Privacy Policy URL, or operator-contact decision exists at the inspected tip. S5 must not invent those values.

### rewards-maxxing-frontend

Inspected locally.

| Item | SHA |
|---|---|
| Functional extraction baseline | `466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source authority baseline (JSE-001/002/003 merge) | `0f75f8b596e9e208b02d54cdf48e2011b5217ff3` |
| Current local `master` HEAD | `3aa256df708667a8286ddcd2f7056db7b39939c3` |
| JSE-003 last content change | `2c093c15aeab752b13b062566144cf48864ac7a1` (S2/S3 status facts) |
| JSE-001 target copy | `docs/architecture/JACKPOT_SITE_EXTRACTION_PLAN.md` |

JSE-003 shell/privacy/analytics dispositions used by this freeze are unchanged vs `0f75f8b` for the files S5 cares about (layout REIMPLEMENT, Navbar REIMPLEMENT, Footer REIMPLEMENT, CookieBanner REIMPLEMENT if retained, ExploreFAB EXCLUDE, SessionInit EXCLUDE, privacy COPY+HARDEN under ACQ-05).

### Newsletter service (context only)

| Item | SHA |
|---|---|
| `jackpot-api-newsletter` `main` | `c6cfaa4ccf9e09f801c3ae4f23dd43b0c88d8cd8` — unchanged vs S4-A |

S5 does not reopen the S4 newsletter contract. Privacy URL/version in that service registry remained `null` at S4-A; this freeze does not claim a newer registry probe.

### DB-W3 closeout authority (do not reopen)

| Packet | Status used by S5 |
|---|---|
| W3-A..E | accepted / complete in-repo |
| Physical public-read contract | `api.v_curated_promo_discovery` + 21-column allowlist; anon/publishable; no service-role |
| W3-F public-view disposition | **pending** — EX-S5-A-02 |
| W3-G wave closeout | **pending** — EX-S5-A-02 |

S5 must not query `public.v_curated_promo_discovery` as a fallback. S5 must not author telemetry or promo DDL.

---

## Frozen shell allowlist (D-S5-01, D-S5-02)

First-release **root shell** may contain only:

```text
metadata / document language
global CSS / system fonts
header / brand / allowed nav
<main>{children}</main>
footer / approved legal links
optional empty consent mount seam (no controlling banner until a sink is authorized)
```

### Route-visible navigation

```text
Primary navigation:
  /
  /privacy

Flow-only (must not appear in header/footer nav):
  /newsletter/confirm

BFF (not navigation):
  POST /api/newsletter/subscribe
  POST /api/newsletter/confirm/validate
  POST /api/newsletter/confirm
```

### Excluded unless later product authority + implemented route

```text
/discover-offers
/newsletter artifact/history
/dashboard
/blog
/terms
Explore FAB/drawer
source Navbar/Footer/SessionInit/CookieBanner
```

Do not create dead navigation. Current layout already matches this nav set.

S5-B **REIMPLEMENT**s layout/header/footer from this allowlist. It may replace construction/staging visitor-facing shell copy. It must not copy source `layout.tsx`.

---

## Footer DOI decision (D-S5-03)

```text
homepage-only DOI
```

Rationale: JSE-003 leaves homepage vs homepage+footer unresolved. Safe default is homepage-only. Current target already mounts `InlineNewsletterHero` with `signupSource="newsletter_landing"` and does not mount a footer form. Do not infer footer signup from legacy `AcquisitionSignup(website_footer)`.

`website_footer` remains a **legal browser DTO enum member** for a future approved placement. S5 must not send it until a footer form is explicitly accepted.

---

## ACQ-05 / Privacy Policy authority (D-S5-04)

```text
final privacy URL: BLOCKED
privacy policy version: BLOCKED
policy content authority: BLOCKED
consent policy version: newsletter-consent-us-v1-2026-07-31
consent -> privacy linkage: BLOCKED
decision owner: jackpot-news / operator — not this repository
Terms: not required; do not add /terms
```

| Item | Frozen status |
|---|---|
| Approved Privacy Policy source | **BLOCKED** — no operator-approved content/path/SHA at inspected `jackpot-news@5bba8b1` |
| Production route/URL | Target scaffold is `/privacy`. That is **not** an approved production policy URL |
| Immutable policy version | **BLOCKED** (S4-A: live newsletter registry `null`; no newer ADR) |
| Operator / business identity | **BLOCKED** except visitor-facing product name already used by EC-05A: `Jackpot Homie` |
| Public contact method | **BLOCKED** |
| First-release data-processing categories actually in the target | Newsletter email + consent/age via same-origin BFF; confirmation token (in-memory, stripped from URL); curated promo **read** of published API view; outbound `sourceUrl` navigation; no analytics cookies; no session id |
| Provider/cookie/analytics statements | Must describe **actual** target behavior after S5-D/E. Do not copy source privacy claims about `session_id`, UTM, or usage cookies the target does not set |
| Terms | **Omit** |

EC-05A consent checkbox copy remains:

> I agree to receive the Jackpot Homie email newsletter with curated casino promotion and event information. Emails are generally sent weekly, with occasional additional updates. I can unsubscribe at any time. See the Privacy Policy.

Those words **Privacy Policy** must eventually link to the approved URL. Today they are plain text on purpose (`doi-copy.ts`). S5-C must not point them at `/privacy` as if it were approved.

**S5-C acceptance is BLOCKED-PENDING-POLICY-AUTHORITY** until URL, immutable version, and content authority exist. S5-C may prepare route/rendering structure but must not mark placeholders complete. Missing values must not be invented.

---

## Consent policy boundary (D-S5-05)

### Analytics activation (D-S5-A-06)

```text
first-release analytics = contract + disabled-by-default implementation
authorized production sink = none
GTM / provider snippet = not authorized
Supabase telemetry schema = not authorized (not an S5 migration)
```

JSE-003 left “omit vs consent-gated GTM” open. This freeze chooses the conservative option that still lets S5-E/F exist: define the event contract; implement a fail-closed seam; emit **zero** network beacons until a later `jackpot-news` / operator sink decision.

### Consent vocabulary (for S5-D)

```text
unknown
essential_only / rejected
analytics_accepted
```

Default at first visit: `unknown`.

Behavior:

```text
unknown / essential_only / rejected
  -> zero non-essential analytics initialization
  -> zero non-essential analytics network emission

analytics_accepted
  -> still zero emission while sink_status is disabled-by-default
  -> if a later packet authorizes a sink, only S5-E allowlisted events may emit

revoked
  -> future optional emission stops
```

All seven candidate events are **optional / non-essential**. Newsletter DOI consent (`consentAccepted` + `consentPolicyVersion`) is **not** analytics consent. Do not reuse it as an analytics grant.

### Persistence (D-S5-A-07)

```text
analytics-consent cookie name: BLOCKED-PENDING-SINK-AUTHORITY
mechanism / lifetime: BLOCKED-PENDING-SINK-AUTHORITY
source cookie_consent: EXCLUDE
email_signup cookie / subscriber_email_hash: EXCLUDE
session_id cookie: EXCLUDE
```

Do not ship a consent cookie or banner that controls nothing. S5-B may reserve an empty mount point. S5-D must implement the fail-closed in-memory/default state so S5-F cannot emit. A first-party preference store is allowed only when a sink is actually authorized; name/lifetime are then frozen before write.

Corrupt/unknown stored values (if a store is later added) fail to optional-disabled.

### Cookie UI

Required only to the extent a non-essential sink is authorized. **First-release: no decorative banner.**

S3/S4 UX must work when analytics are unknown or rejected.

---

## First-release telemetry candidates (D-S5-06..11)

Maximum set: JSE-001 seven events. S5-E may **narrow**. Expansion requires newer product authority than `jackpot-news@5bba8b1`.

Global prohibited payload / log fields (D-S5-08):

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
stable session or user identifier
```

Session identity (D-S5-A-08): **omit**. No measurement requirement at inspected authority justifies it. Do not copy `middleware.ts` / `SessionInit`.

Sink status for every candidate: **disabled-by-default**. S5-F may use a fake/no-op transport for local tests. Fail-soft (D-S5-11): telemetry failure must not change curated discovery, filter/card/detail, source-link navigation, DOI request, or confirmation outcomes.

Do not copy `useTracker`, `/api/log-session`, `/api/log-interaction`, `/api/log-click`, or `logEmailSignup` (D-S5-10).

### Candidate table

| Event | Business question | Exact trigger (S5-E must pin) | Consent | Allowed payload (candidate) | Dedupe (candidate) | Source | Identity | Sink |
|---|---|---|---|---|---|---|---|---|
| `curated_promo_discovery_view` | Did the homepage discovery surface render? | Landing section view commits to render (success path with rows). S5-E must say whether fail-soft/empty shares this event or uses empty-state | optional | none required; no promo list dump | once per page view | `CuratedPromoLandingSectionView` on `/` | omit | disabled-by-default |
| `curated_promo_filter_click` | Which filters do visitors use? | Filter chip toggle in `CuratedPromoFilterChips` (brand, marketSlug, signalCategory, signalType). Source-kind chips are **not** rendered | optional | `filterKey` enum `brand` \| `marketSlug` \| `signalCategory` \| `signalType`; `action` `apply` \| `clear`; **no** free-text bag. Values only if they are already public DTO enums/tokens — S5-E must forbid raw PII and unbounded strings | one event per toggle | DiscoveryWidget / FilterChips on `/` | omit | disabled-by-default |
| `curated_promo_card_open` | Which promos are opened? | `handleOpenPromo` / card `onOpen` | optional | `promoId` only (not `sourceUrl`, title, email, evidence text) | one per open; re-open counts | Card / DiscoveryWidget | omit | disabled-by-default |
| `curated_promo_empty_state_view` | Is the surface empty or failing? | EmptyState actually rendered. S5-E must distinguish published-empty vs filter-empty vs `ok: false` fail-soft — likely a bounded `reason` enum, not the visitor message string | optional | `reason` enum only | once per view of that empty state | EmptyState / LandingSectionView | omit | disabled-by-default |
| `curated_promo_source_click` | Do visitors leave to verify the source? | Click on DetailSheet “View source” when `sourceUrl` is present | optional | `promoId` only — **not** the URL | one per click | `CuratedPromoDetailSheet` | omit | disabled-by-default |
| `newsletter_subscribe_requested` | Did the BFF accept a public request? | Browser subscribe client receives frozen status `accepted`. **Not** button click, client validation failure, `invalid`, `rate_limited`, or `unavailable` | optional | `signupSource` (`newsletter_landing` only in v1). No email/hash | one per accepted response; do not treat generic success as confirm | DOI form on `/` | omit | disabled-by-default |
| `newsletter_subscription_confirmed` | Did confirmation consume succeed? | Confirm consume browser status `success` (terminal). **Not** validate `ready_to_confirm`. **Not** subscribe `accepted` | optional | no payload required. S5-E must freeze `already_complete` as **non-emit** unless product later asks for idempotent-complete measurement (would be a new name, not this one) | once per successful consume in that page lifetime; repeat visits that only validate `already_complete` do not emit this event | `NewsletterConfirmClient` on `/newsletter/confirm` | omit | disabled-by-default |

DOI analytics semantics (D-S5-07) are binding: requested ≠ confirmed. A non-enumerating subscribe `accepted` must never be counted as confirmation.

---

## DB-W4 concurrency boundary (D-S5-09)

S5 owns:

```text
application event semantics
consent gating
payload allowlisting
nonblocking emission seam
local acceptance with fake/no-op transport
```

S5 does **not** own:

```text
telemetry tables/schemas
migration of session_logs, click_logs, or interaction_logs
telemetry RPCs
grants/RLS
SECURITY DEFINER strategy
durable retention
persistent session/user identity
BI/warehouse modeling
```

If a production sink needs any of those, mark **only that sink** `BLOCKED-DB-W4`. S5-E is an input to later DB-W4 telemetry design, not a license to recreate legacy log tables.

JSE-S5 does not depend on DB-W4 completion.

---

## Unresolved decisions and owners

| Decision | Status | Owner |
|---|---|---|
| Privacy Policy URL / version / content | BLOCKED — blocks S5-C acceptance and public DOI enablement | `jackpot-news` / operator (ACQ-05 / EC-05A) |
| Operator contact / legal entity lines in policy | BLOCKED | same |
| Analytics production sink / GTM container | deferred — no sink in S5 | `jackpot-news` measurement + Hosted Acceptance |
| Consent-cookie name/lifetime | BLOCKED until a sink is authorized | S5-D after sink authority |
| Footer DOI | frozen homepage-only | product; reopen only with explicit approval |
| `/terms` | frozen omit | legal/product |
| Session ID | frozen omit | measurement; requires explicit requirement |
| S4-H merge | unmerged evidence branch | operators; not an S5 runtime blocker (EX-S5-A-01) |
| W3-F/G public-view retirement | pending | DB wave / `core`; not an S5 blocker (EX-S5-A-02) |
| Hosted OIDC / SendGrid / DNS / public DOI | out of S5 | Hosted Acceptance / ADR-0003/0004 |

---

## Conclusion

```text
S5-A: ACCEPTED (policy freeze)

S5-B: unblocked — implement allowlisted shell
S5-C: BLOCKED-PENDING-POLICY-AUTHORITY for acceptance
S5-D: unblocked for fail-closed consent state; no decorative banner; no consent cookie write
S5-E: unblocked — freeze schemas from the candidate table (may narrow, must not expand)
S5-F: still blocked on S5-D + S5-E; transport remains disabled-by-default / fake
S5-H: cannot call JSE-S5 complete while ACQ-05 URL/version/content remain blocked
```

S5 does not transfer production authority (D-S5-12).

---

## Runtime copy

None. Documentation / inventory / policy freeze only.

---

## Acceptance checklist

- [x] Accepted S5 start SHA and upstream authority SHAs recorded.
- [x] Shell/global-runtime inventory complete.
- [x] First-release route allowlist frozen.
- [x] Footer DOI placement decided (homepage-only).
- [x] Privacy URL/version/content authority recorded as BLOCKED; S5-C blocked for acceptance.
- [x] Consent policy boundary recorded.
- [x] First-release telemetry questions/candidates frozen (seven-event maximum).
- [x] Session identity decision explicit (omit).
- [x] DB-W4 concurrency boundary recorded.
- [x] No runtime or production changes performed.
