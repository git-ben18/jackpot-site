# W3-D — Low-privilege acceptance evidence

| Field | Value |
|---|---|
| Packet | DB-W3-D |
| Date | 2026-09-08 |
| Environment | Supabase project Data API / PostgREST (live) |
| Identity | **`anon`** via local `.env.local` `SUPABASE_PUBLISHABLE_KEY` (not committed; not service-role) |
| State | **VERIFIED** → conclusion **ACCEPTED** |
| Depends on | W3-C applied (operator SQL editor) |
| Branch | `docs/db-w3-d-low-privilege-acceptance` |

Secrets, JWTs, and full promo payloads are omitted. HTTP status, PostgREST/`code`/`message`, and response **keys** only.

## 1. Preconditions

| Check | Result |
|---|---|
| W3-C `api` schema + `api.v_curated_promo_discovery` applied | yes (operator) |
| `api` reachable via Data API (`Accept-Profile: api`) | **yes** (cases A/B HTTP 200) |
| Session env: `SUPABASE_URL` | set locally via `.env.local` (gitignored) |
| Session env: `SUPABASE_PUBLISHABLE_KEY` | set locally; length observed only; **not** service-role |

## 2. Acceptance matrix

| Case | Method | Relation / profile | Expected | HTTP | Body / error (non-secret) | Pass? |
|---|---|---|---|---|---|---|
| A. API SELECT | GET | `Accept-Profile: api` → `v_curated_promo_discovery` short allowlist `limit=1` | 200 | **200** | row returned (`promo_id`, `promo_slug`, `brand`, `active_status`) | **PASS** |
| B. API SELECT full allowlist | GET | same, full JSE-S3 column list `limit=1` | 200; allowlist keys | **200** | keys match § contract-shape | **PASS** |
| C. INSERT deny | POST | `Content-Profile: api` → `v_curated_promo_discovery` | denied | **500** | `55000` / `cannot insert into view "v_curated_promo_discovery"` (WITH view not updatable) | **PASS** |
| D. UPDATE deny | PATCH | `Content-Profile: api` | denied | **500** | `55000` / `cannot update view "v_curated_promo_discovery"` | **PASS** |
| E. DELETE deny | DELETE | `Content-Profile: api` | denied | **500** | `55000` / `cannot delete from view "v_curated_promo_discovery"` | **PASS** |
| F. publish instances deny | GET | `Accept-Profile: publish` → `published_curated_offer_instances_raw` | denied | **401** | `42501` / `permission denied for schema publish` | **PASS** |
| G. publish signals deny | GET | `Accept-Profile: publish` → `published_curated_offer_signals_raw` | denied | **401** | `42501` / `permission denied for schema publish` | **PASS** |
| H2. api must not expose producers | GET | `Accept-Profile: api` → `published_curated_offer_instances_raw` | missing / deny | **404** | `42P01` / `relation "api.published_curated_offer_instances_raw" does not exist` | **PASS** |

### Informational (not pass/fail for W3-D)

| Case | HTTP | Note |
|---|---|---|
| `Accept-Profile: public` → `v_curated_promo_discovery` | **401** | `42501` permission denied for view — anon cannot use the retained public compatibility view; site must use `api` |
| `Accept-Profile: public` → `published_newsletter_event_candidates` | **200** | Pre-existing public exposure; **not** introduced by DB-W3 `api` objects |

### Write-denial nuance

Mutations fail with PostgreSQL `55000` (non-updatable `WITH` view), not ACL `42501`. No insert/update/delete succeeded. This satisfies W3-D write denial for the live contract. Optional hardening in `core`: explicit `REVOKE INSERT, UPDATE, DELETE ON api.v_curated_promo_discovery FROM anon` if not already present (defense in depth; not required to accept this packet).

## 3. Contract-shape evidence (case B keys)

```text
promo_id,promo_slug,brand,market_slug,location_label,title,subtitle,
source_kind,source_url,primary_asset_url,active_status,
visible_start_date,visible_end_date,observed_at,
signal_families,signal_types,gameplay_tags,badges,
top_signals_json,signals_json,evidence_json
```

- Matches JSE-S3 / W3-B allowlist.
- No lineage columns required (`observation_id`, `source_folder_slug`, `import_run_id`, `created_at`, `updated_at` absent from selected set).
- `promo_id` appears as a string id (contract type **text**).

## 4. Conclusion

```text
ACCEPTED
```

Reasons:

- `anon` can `SELECT` `api.v_curated_promo_discovery` with explicit schema routing and the full allowlist.
- Writes against the API view do not succeed.
- `publish` schema remains denied to `anon`.
- DB-W3 did not place producer tables into `api`.
- Do not unblock site cutover via service-role; W3-E should use `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` with `.schema('api')`.

## 5. Checklist

- [x] explicit `api` routing succeeds
- [x] approved SELECT succeeds
- [x] explicit selected columns validated
- [x] writes denied
- [x] `publish.*` read denied
- [x] unrelated object exposure not introduced (via `api`)
- [x] evidence committed
- [x] conclusion `ACCEPTED`
