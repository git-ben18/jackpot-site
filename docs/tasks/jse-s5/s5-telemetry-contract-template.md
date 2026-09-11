# S5 first-release telemetry contract template

S5-A freezes **candidates and policy**. S5-E fills this form into `docs/tasks/jse-s5/s5-telemetry-contract.md` and is the only packet that may declare event schemas accepted for implementation.

Do not add events because legacy `useTracker` / `/api/log-*` existed. Do not invent a Supabase telemetry table here.

## Frozen S5-A policy (do not reopen in S5-E except to narrow)

```text
event set maximum: the seven JSE-001 names below
session / user identifier: OMIT
production sink: none authorized
S5-F transport: disabled-by-default; fake/no-op allowed for local tests
consent class: optional / non-essential for every candidate
fail-soft: telemetry must never change S3/S4 visitor outcomes
DB-W4: S5 does not create telemetry DDL/RPC/grants/RLS
```

## Per-event form

Copy one block per frozen event.

```text
event_name:
schema_version:
business_question:
exact_trigger:
consent_class: optional_non_essential
allowed_payload:
prohibited_payload: (global list in _status-S5-A.md plus any event-specific)
dedupe:
source_route_component:
session_user_identity: omit
failure_behavior: swallow; product UX unchanged
sink_status: disabled-by-default
```

## Candidate names (maximum set)

```text
curated_promo_discovery_view
curated_promo_filter_click
curated_promo_card_open
curated_promo_empty_state_view
curated_promo_source_click
newsletter_subscribe_requested
newsletter_subscription_confirmed
```

S5-E may drop events. Expansion requires newer `jackpot-news` product/measurement authority than the S5-A inspected SHA.
