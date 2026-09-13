# S6-B — Production-safety inventory

| Field | Value |
|---|---|
| Track | S6-B |
| Type | Docs + repository searches / build evidence |
| Depends on | S6-A accepted |
| Blocks | S6-H; informs S6-C+ but does not authorize deploy |
| Estimate | M |
| Repo | git-ben18/jackpot-site |

## Goal

Produce the JSE-001 §18-style **target** inventory for routes, dependencies, env names, and credentials **on the frozen S6 start SHA** (or a later main descendant named by S6-A). Prove the local production-safety properties that hosted packets must not regress.

S6-B does not deploy. Passing S6-B does not authorize Vercel, OIDC, SendGrid, or public DOI.

## Required inventory

Using [s6-hosted-acceptance-inventory-template.md](./s6-hosted-acceptance-inventory-template.md):

1. Exact browser pages and BFF routes from the production build.
2. Package/import audit: no dashboard, Hottest Offers, `LandingDashboardClient`, manufacturing, or event-discovery UI.
3. Server vs browser env **names**; no `NEXT_PUBLIC_` secrets; no newsletter hostname in client bundles.
4. No unjustified `SUPABASE_SERVICE_ROLE_KEY` / admin client.
5. Active-runtime guardrail searches (template literals) on `src/` excluding tests/fixtures.
6. Shell nav still inside the S5-A allowlist (`/`, `/privacy`; confirm flow-only).
7. Kill-switch default fail-closed in code (do not enable it here).
8. Telemetry production sink still explicit `disabled` unless S6-A recorded a new sink authority.

Run, at minimum:

```text
npm test
npm run typecheck
npm run build
```

Record Node/package manager versions, test counts, and the exact tested SHA. Distinguish that SHA from later evidence-only commits.

## Newsletter / identity static proofs (not hosted)

Re-assert from existing S4/S5 tests rather than re-implementing:

- browser calls only same-origin BFF;
- fake identity forbidden in production mode;
- subscribe non-enumeration;
- confirmation token stripped from URL and absent from telemetry.

Cite the test files and S4-H / S5-F / S5-G evidence. Do not call these “hosted accepted.”

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-B.md` with the filled inventory, search results, build/test table, and conclusion `accepted` or `blocked`.

If a production-safety defect exists in `main`, remediate on a focused branch **or** block S6-C. Do not hide defects as “hosted deferrals.”

## Out of scope

Vercel UI, real OIDC, real SendGrid, DNS, Privacy Policy content, GTM, DB-W4 schema, public DOI.

## Acceptance checklist

- [ ] Route inventory matches S6-A allowlist
- [ ] Guardrail searches recorded (no unjustified hits)
- [ ] Env names inventoried without secret values
- [ ] No service-role in ordinary public rendering
- [ ] No browser-direct newsletter backend
- [ ] Tests/typecheck/build pass at recorded SHA
- [ ] Evidence says this is not hosted acceptance

## Agent prompt

~~~text
Implement only S6-B from docs/tasks/jse-s6/S6-B-production-safety-inventory.md.
Inventory routes, dependencies, env names, and credentials on the S6-A SHA.
Run tests/typecheck/build and guardrail searches. Do not deploy or enable DOI.
~~~
