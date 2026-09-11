# S5 first-release telemetry contract

| Field | Value |
|---|---|
| Packet | S5-E |
| Schema family | `jackpot-site.first_release_telemetry` |
| Schema version | `v1` |
| Authority | [_status-S5-A.md](./_status-S5-A.md) D-S5-06..11; S5-D consent gate |
| Machine contract | `src/lib/telemetry/first-release-telemetry-contract.ts` |
| Status | [_status-S5-E.md](./_status-S5-E.md) |

This document freezes **application meaning** only. It does not define Supabase tables, RPCs, grants, RLS, SECURITY DEFINER functions, retention jobs, or warehouse models. DB-W4 may consume these facts later.

## Global policy (frozen)

```text
event set: exactly the seven names below (no expansion without newer jackpot-news authority)
consent_class: optional_non_essential for every event
session / user identity: OMIT
production sink: disabled-by-default (none authorized)
fail-soft: telemetry failure must never change curated UI, source links, DOI, or confirmation
S5-D: unknown / essential_only => zero transport calls; accepted still requires authorized sink
```

## Global prohibited payload / context fields

Unless newer authority explicitly approves a field, never include:

```text
email
email hash / subscriber_email_hash
confirmation token
authorization / workload / OIDC assertion
raw page URL query or fragment
raw referrer
IP supplied by application code
user agent supplied by application code
full backend / provider error body
service or database credentials
arbitrary free-form metadata object
legacy reward / access token
stable session or user identifier
entire CuratedPromoDiscoveryDTO / promo list dump
sourceUrl or any full outbound URL
```

## Frozen event list (closed allowlist)

```text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
```

---

## curated_promo_discovery_view

```text
event_name: curated_promo_discovery_view
schema_version: v1
business_question: Did the homepage discovery surface render published promos?
exact_trigger: CuratedPromoLandingSectionView on `/` commits a success render with result.ok === true AND result.promos.length > 0. Fail-soft (ok === false) and zero-row publish do NOT emit this event (use curated_promo_empty_state_view).
consent_class: optional_non_essential
allowed_payload: {} (no keys)
prohibited_payload: global list; no promo arrays/titles/evidence
dedupe: once per page lifetime for that mount
source_route_component: `/` → CuratedPromoLandingSectionView (success path)
session_user_identity: omit
failure_behavior: swallow; product UX unchanged
sink_status: disabled-by-default
```

## curated_promo_filter_click

```text
event_name: curated_promo_filter_click
schema_version: v1
business_question: Which discovery filters do visitors toggle?
exact_trigger: CuratedPromoFilterChips toggle handler fires for brand, marketSlug, signalCategory, or signalType. Source-kind chips are not rendered and must not appear as filterKey.
consent_class: optional_non_essential
allowed_payload:
  filterKey: enum brand | marketSlug | signalCategory | signalType
  action: enum apply | clear
  filterValue: token string, max 64 chars, charset [A-Za-z0-9_.:-]+ ; required for apply; omitted for clear
  (signalCategory values must be CuratedPromoSignalCategory tokens when filterKey=signalCategory)
prohibited_payload: global list; no free-text bags; no email-like values; no sourceUrl
dedupe: one event per toggle interaction
source_route_component: `/` → CuratedPromoDiscoveryWidget / CuratedPromoFilterChips
session_user_identity: omit
failure_behavior: swallow; product UX unchanged
sink_status: disabled-by-default
```

## curated_promo_card_open

```text
event_name: curated_promo_card_open
schema_version: v1
business_question: Which published promos do visitors open?
exact_trigger: DiscoveryWidget handleOpenPromo / card onOpen for a rendered promo.
consent_class: optional_non_essential
allowed_payload:
  promoId: string (public DTO promoId only; max 128; charset [A-Za-z0-9_-]+)
prohibited_payload: global list; no title, brand, evidence, sourceUrl, or full DTO
dedupe: one event per open; re-open counts as a new event
source_route_component: `/` → CuratedPromoCard / CuratedPromoDiscoveryWidget
session_user_identity: omit
failure_behavior: swallow; product UX unchanged
sink_status: disabled-by-default
```

## curated_promo_empty_state_view

```text
event_name: curated_promo_empty_state_view
schema_version: v1
business_question: Is the discovery surface empty or fail-soft?
exact_trigger: CuratedPromoEmptyState actually rendered on `/`.
consent_class: optional_non_essential
allowed_payload:
  reason: enum published_empty | filter_empty | fail_soft
    published_empty: ok === true && promos.length === 0 (widget empty copy)
    filter_empty: filters exclude all rows; EmptyState clear-filters path
    fail_soft: landing result.ok === false (visitor-safe error EmptyState)
prohibited_payload: global list; do not emit the visitor-facing message string
dedupe: once per page lifetime per reason value
source_route_component: `/` → CuratedPromoLandingSectionView / CuratedPromoDiscoveryWidget / CuratedPromoEmptyState
session_user_identity: omit
failure_behavior: swallow; product UX unchanged
sink_status: disabled-by-default
```

## curated_promo_source_click

```text
event_name: curated_promo_source_click
schema_version: v1
business_question: Do visitors leave to verify the source offer?
exact_trigger: Click on DetailSheet “View source” when promo.sourceUrl is present.
consent_class: optional_non_essential
allowed_payload:
  promoId: string (same rules as card_open)
prohibited_payload: global list; never the sourceUrl or any URL/query/fragment
dedupe: one event per click
source_route_component: `/` → CuratedPromoDetailSheet
session_user_identity: omit
failure_behavior: swallow; outbound navigation unchanged
sink_status: disabled-by-default
```

## newsletter_subscribe_requested

```text
event_name: newsletter_subscribe_requested
schema_version: v1
business_question: Did the same-origin subscribe BFF return the approved non-enumerating accepted outcome?
exact_trigger: Browser subscribe client maps HTTP 200 + { status: "accepted" }. NOT button click; NOT client validation failure; NOT invalid / rate_limited / unavailable.
consent_class: optional_non_essential
allowed_payload:
  signupSource: enum newsletter_landing   (v1 only; website_footer not emitted until footer DOI is accepted)
prohibited_payload: global list; never email or email hash
dedupe: one event per accepted browser response
source_route_component: `/` → DoiNewsletterSignupForm / subscribe-client
session_user_identity: omit
failure_behavior: swallow; DOI UX unchanged
sink_status: disabled-by-default
notes: Means acquisition service accepted a request for processing under the non-enumerating contract. Does NOT prove insert, eligibility, SendGrid delivery, or confirmation.
```

## newsletter_subscription_confirmed

```text
event_name: newsletter_subscription_confirmed
schema_version: v1
business_question: Did confirmation consume succeed for a new confirmation in this page lifetime?
exact_trigger: NewsletterConfirmClient / confirm-client consume returns browser status success (terminal). NOT validate ready_to_confirm. NOT subscribe accepted. NOT consume already_complete (non-emit). NOT invalid_or_unusable / unable_to_confirm.
consent_class: optional_non_essential
allowed_payload: {} (no keys)
prohibited_payload: global list; never confirmation token
dedupe: once per successful consume in that page lifetime; repeat visits that only validate already_complete do not emit
source_route_component: `/newsletter/confirm` → NewsletterConfirmClient
session_user_identity: omit
failure_behavior: swallow; confirmation UX unchanged
sink_status: disabled-by-default
notes: requested ≠ confirmed. already_complete is explicitly non-emit in v1 (a future idempotent-complete metric would need a new event name).
```

---

## DB-W4 handoff (contract facts only)

```text
event names + schema_version v1
payload allowlists / enums above
consent_class: optional_non_essential
cardinality/dedupe per event
identity: omit
sink_status: disabled-by-default
open retention questions: unresolved (operator / later wave; not invented here)
```

Do **not** recreate legacy `session_logs`, `click_logs`, or `interaction_logs` from this contract by default.
