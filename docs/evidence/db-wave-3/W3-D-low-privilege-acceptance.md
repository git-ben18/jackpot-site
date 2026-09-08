# W3-D — Low-privilege acceptance evidence

| Field | Value |
|---|---|
| Packet | DB-W3-D |
| Date | 2026-09-08 |
| Environment | Supabase project Data API / PostgREST (live) |
| Identity | **`anon`** via local `.env.local` `SUPABASE_PUBLISHABLE_KEY` (not committed; not service-role) |
| State | **VERIFIED** → conclusion **ACCEPTED** |
| Depends on | [W3-C-migration-apply.md](./W3-C-migration-apply.md) — APPLIED AND VERIFIED |
| Branch | `docs/db-w3-d-low-privilege-acceptance` |

Secrets, JWTs, and full promo payloads are omitted. HTTP status, PostgREST/`code`/`message`, and response **keys** only.

## 1. Preconditions

| Check | Result |
|---|---|
| W3-C `api` schema + `api.v_curated_promo_discovery` applied | yes ([W3-C evidence](./W3-C-migration-apply.md)) |
| `api` reachable via Data API (`Accept-Profile: api`) | **yes** (cases A/B HTTP 200) |
| Session env: `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | set locally via `.env.local` (gitignored); **not** service-role |

## 2. Acceptance matrix

| Case | Method | Relation / profile | Expected | HTTP | Body / error (non-secret) | Pass? |
|---|---|---|---|---|---|---|
| A. API SELECT | GET | `Accept-Profile: api` → short allowlist `limit=1` | 200 | **200** | row returned | **PASS** |
| B. API SELECT full 21-column allowlist | GET | `Accept-Profile: api` | 200; allowlist keys | **200** | keys match §3 | **PASS** |
| C. INSERT | POST | `Content-Profile: api` | denied | **500** | `55000` cannot insert into view | **PASS** — no mutation |
| D. UPDATE | PATCH | `Content-Profile: api` | denied | **500** | `55000` cannot update view | **PASS** — no mutation |
| E. DELETE | DELETE | `Content-Profile: api` | denied | **500** | `55000` cannot delete from view | **PASS** — no mutation |
| F. publish instances | GET | `Accept-Profile: publish` → `published_curated_offer_instances_raw` | denied | **401** | `42501` permission denied for schema publish | **PASS** |
| G. publish signals | GET | `Accept-Profile: publish` → `published_curated_offer_signals_raw` | denied | **401** | `42501` permission denied for schema publish | **PASS** |
| H. producer via `api` | GET | `Accept-Profile: api` → `published_curated_offer_instances_raw` | missing | **404** | `42P01` relation does not exist | **PASS** |

### Informational

| Case | HTTP | Note |
|---|---|---|
| `anon` → `public.v_curated_promo_discovery` | **401** | permission denied — site must use `api` |
| `anon` → `public.published_newsletter_event_candidates` | **200** | Pre-existing public exposure; **not** introduced by DB-W3 |

### Layered DML protection

W3-C already established ACL:

```text
anon receives SELECT only;
INSERT/UPDATE/DELETE grants are absent/revoked.
```

Runtime results add structural protection:

```text
DML protection is layered:

1. ACL:
   anon has SELECT only;
   INSERT/UPDATE/DELETE grants are absent/revoked.

2. Runtime relation structure:
   direct PostgREST mutations additionally fail with PostgreSQL 55000
   because the aggregate/CTE API view is not updatable.

No mutation path succeeded.
```

Do **not** describe explicit DML revoke as optional hardening — it is part of the applied W3-C contract.

## 3. Contract-shape evidence (case B keys)

```text
promo_id,promo_slug,brand,market_slug,location_label,title,subtitle,
source_kind,source_url,primary_asset_url,active_status,
visible_start_date,visible_end_date,observed_at,
signal_families,signal_types,gameplay_tags,badges,
top_signals_json,signals_json,evidence_json
```

- Matches the 21-column DB-W3 / JSE-S3 allowlist.
- No lineage columns in the selected set.
- `promo_id` is **text**.

## 4. Conclusion

```text
ACCEPTED
```

Reasons:

- `anon` can `SELECT` `api.v_curated_promo_discovery` with explicit schema routing and the full allowlist.
- Writes against the API view do not succeed (ACL + non-updatable view).
- `publish` schema remains denied to `anon`.
- DB-W3 did not place producer tables into `api`.
- W3-E should use `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` with `.schema('api')` — no service-role.

## 5. Checklist

- [x] explicit `api` routing succeeds
- [x] approved SELECT succeeds
- [x] explicit selected columns validated
- [x] writes denied
- [x] `publish.*` read denied
- [x] unrelated object exposure not introduced (via `api`)
- [x] evidence committed
- [x] conclusion `ACCEPTED`
