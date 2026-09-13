# S6-B — Production security and Internet-exposure inventory

| Field | Value |
|---|---|
| Track | S6-B |
| Type | Repository audit + build evidence + production attack-surface review |
| Depends on | S6-A accepted |
| Blocks | S6-C…H |
| Repo | git-ben18/jackpot-site |

## Goal

Audit the complete release-candidate surface, not only functionality introduced by S6.

S6-B must identify what an anonymous or malicious Internet client can reach, influence, exhaust, bypass, or cause to disclose. It covers inherited S2–S5 work, framework behavior, transitive dependencies, runtime configuration, and production build output.

Passing S6-B is mandatory before S6-C. There is no waiver.

## Required inventory

Using the shared inventory template, record:

1. Exact browser pages, API/BFF routes, methods, framework-generated routes, redirects, error routes, and static assets relevant to public behavior.
2. Package/import inventory and transitive production dependencies.
3. Server vs browser env names and secret scope.
4. Browser bundle inspection for secrets, upstream hostnames, assertions, tokens, debug data, and unintended configuration.
5. Supabase access path and least-privilege posture.
6. Newsletter BFF/upstream boundary.
7. Logging/error behavior.
8. Security headers, CSP/referrer policy, cache behavior, and other public response controls where applicable.
9. Input surface: body size, malformed JSON/form data, unexpected methods/content types, repeated requests, and validation limits.
10. External-call surface: Supabase, newsletter API, telemetry, provider-related routes/config, and other configured services.
11. Preview/staging/production configuration differences.
12. Dependency/supply-chain findings relevant to production runtime.

At minimum run:

```text
npm test
npm run typecheck
npm run build
```

Record exact SHA, Node/package manager versions, test counts, and build result.

## Required adversarial review

For every public route or mutation-capable path, reason about and where practical locally test:

- route/method probing;
- malformed and oversized inputs;
- unexpected content types;
- repeated/automated calls;
- browser-supplied auth/header spoofing;
- upstream URL/header injection;
- token/email/assertion leakage;
- stack trace/upstream-body disclosure;
- cache/referrer leakage;
- direct newsletter/API bypass attempts;
- preview-to-production privilege assumptions.

Findings are either remediated before S6-C or recorded as blockers. Do not relabel a defect as “hosted-only.”

## Required guardrail searches

Include existing extraction guardrails plus searches for:

```text
/api/subscribe
email_signups
SUPABASE_SERVICE_ROLE_KEY
getSupabaseAdminClient
Authorization
Bearer
NEWSLETTER_SERVICE_BASE_URL
NEXT_PUBLIC_
console.log
console.error
token
email
VERCEL_ENV
workload
oidc
```

Interpret hits; do not treat all string matches as defects.

## Production dependency review

Record:

- direct runtime dependencies;
- packages no longer needed after extraction;
- packages with production security advisories if the package manager audit/tooling reports them;
- whether any dependency introduces server privileges, browser telemetry, dynamic script injection, or network behavior beyond the accepted architecture.

Do not upgrade dependencies merely to make the checklist green without assessing compatibility. A material unresolved production vulnerability is a blocker.

## Evidence output

Create `docs/tasks/jse-s6/_status-S6-B.md` with:

- route/method inventory;
- dependency/runtime inventory;
- env/credential inventory;
- browser-bundle observations;
- headers/cache/referrer observations;
- adversarial-input findings;
- guardrail-search results;
- tests/typecheck/build evidence;
- remediation/blocker list;
- exact tested SHA.

## Acceptance checklist

- [ ] Full public/runtime surface inventoried, including prior-slice features
- [ ] Framework-generated/public error surfaces considered
- [ ] Dependencies and production advisories reviewed
- [ ] Browser bundle inspected for sensitive material
- [ ] Env/secrets and least privilege reviewed
- [ ] Headers/CSP/referrer/cache posture reviewed where applicable
- [ ] Malformed/oversized/repeated/adversarial input behavior assessed
- [ ] Route/method/auth probing assessed
- [ ] Logs/errors do not expose sensitive upstream material
- [ ] Tests/typecheck/build pass on exact SHA
- [ ] No unresolved production defect is waived into S6-C
