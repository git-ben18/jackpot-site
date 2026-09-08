# W3-E status

| Field | Value |
|---|---|
| Date | 2026-09-08 |
| Packet | [W3-E-jackpot-site-cutover.md](./W3-E-jackpot-site-cutover.md) |
| Result | Complete — application uses `api.v_curated_promo_discovery` |
| Branch | `feat/db-w3-e-api-cutover` |

## Checklist

- [x] application uses explicit `api` schema
- [x] approved view name used
- [x] explicit columns preserved
- [x] mapper boundary preserved
- [x] no service-role
- [x] no `publish.*` direct read
- [x] no silent public-view fallback
- [x] tests pass
- [x] typecheck passes
- [x] build passes
- [x] JSE-S3 current planning docs refreshed
- [x] homepage not mounted (S3-G still owns live wiring)
- [x] ready for W3-F / subsequent S3-G
