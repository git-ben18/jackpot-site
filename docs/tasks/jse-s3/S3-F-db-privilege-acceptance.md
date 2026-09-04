# S3-F — Database privilege / view acceptance

| Field | Value |
|---|---|
| Track | S3-F |
| Type | Evidence / spike (minimal code) |
| Depends on | S3-E |
| Blocks | S3-G (only when conclusion is `accepted`) |
| If blocked for RLS/grants | [S3-F-RLS](./S3-F-RLS-public-read-remediation.md) |
| Estimate | M |
| PR grouping | PR 5 (with S3-G) |

## Goal

Prove the public-read boundary is secure at the **database** layer for the low-privilege identity used by S3-E. Application code alone is not acceptance.

## Decisions to assume

- **D-S3-06** — acceptance matrix is mandatory
- View ownership / `security_invoker` behavior must be understood and documented
- Unresolved privilege questions **block** S3-G

## Migration authority (hard rule)

`jackpot-site` does **not** own Supabase schema, grant, RLS, or `security_invoker` migrations.

If S3-F discovers that the view definition, grants, `security_invoker`, RLS, or related producer-table privileges must change:

1. **stop** with conclusion `blocked`;
2. record the required change and evidence that motivated it;
3. open **S3-F-RLS** ([S3-F-RLS-public-read-remediation.md](./S3-F-RLS-public-read-remediation.md)) — do not treat a footnote as the work;
4. route the database change through the **current Supabase migration authority** (the repo/process that already owns published-view DDL for this project);
5. do **not** apply ad-hoc production DDL from `jackpot-site`;
6. do **not** invent service-role usage in this repository as a workaround.

Re-run this packet’s acceptance matrix after S3-F-RLS is `remediated`. Only then may S3-F conclude `accepted`. If the matrix already matches D-S3-06 with no RLS/grant gap, mark S3-F-RLS `N/A` and continue.

## Implementation requirements

1. Use only authoritative connection details supplied via repo env docs, `.env.example` purpose names, or ops-provided non-secret instructions. Do not invent database hosts.
2. Identify the exact low-privilege role/key class used by S3-E (`publishable` or documented anon compatibility).
3. Against a non-production or explicitly approved environment, gather evidence for:

```text
SELECT public.v_curated_promo_discovery (approved columns)
→ succeeds for intended published rows

INSERT / UPDATE / DELETE on the view (or clear equivalent proof)
→ denied

unrelated internal object reads
→ denied

raw / canonical producer tables
→ not newly exposed merely for jackpot-site
```

4. Inspect and document:
   - view owner
   - grants to the low-privilege role
   - whether `security_invoker = true` is set / appropriate / supported
   - RLS relevance if any
5. Record non-secret evidence in `docs/evidence/jse-s3-db-privilege.md` (or `docs/tasks/jse-s3/_status-S3-F.md`):
   - date / environment name
   - role identity class (not the secret value)
   - commands or query descriptions used
   - results (success/denied)
   - conclusion: `accepted` | `blocked`
6. If blocked by missing/incorrect view, grants, `security_invoker`, or RLS: follow the **Migration authority** rule above and implement **S3-F-RLS**. List the exact relations and gaps for the migration owner. Do **not** proceed to invent service-role usage as a workaround.
7. No production cutover. No homepage wiring in this task unless already present and unchanged.

## Suggested deliverables

- `docs/evidence/jse-s3-db-privilege.md` with the acceptance matrix filled
- Optional SQL snippets used for verification (no credentials)
- Status note `accepted` or `blocked` with owners/next steps
- If blocked for DDL/grants: handoff into S3-F-RLS naming the Supabase migration authority and required change

## Out of scope

- Applying schema/grant/RLS/`security_invoker` DDL from this repository
- Changing production DNS / cutover
- Broadening grants “to make the site work” without documenting risk and routing through migration authority
- Implementing service-role fallback
- S3-G homepage integration (unless this task only documents prerequisites)

## Acceptance checklist

- [ ] Evidence doc exists with date/environment/role class
- [ ] SELECT success evidenced for approved view/columns
- [ ] Mutation denial evidenced
- [ ] Unrelated internal read denial evidenced
- [ ] Producer-table exposure reviewed
- [ ] View owner / security_invoker determination recorded
- [ ] Explicit `accepted` or `blocked` conclusion
- [ ] If DDL/grants must change: `blocked` with S3-F-RLS opened (no ad-hoc DDL from jackpot-site)
- [ ] No service-role workaround introduced
- [ ] S3-G unblocked only if conclusion is `accepted`

## Agent prompt

```text
Implement only S3-F from docs/tasks/jse-s3/S3-F-db-privilege-acceptance.md
Prove D-S3-06 against the low-privilege identity. Document
security_invoker/owner/grants. If view/grants/RLS must change, stop, conclude blocked, and
continue with S3-F-RLS in the Supabase migration authority — do not
apply DDL from jackpot-site and do not use service-role. No homepage
live integration.
```
