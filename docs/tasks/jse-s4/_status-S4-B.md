# S4-B status

| Field | Value |
|---|---|
| Date | 2026-09-09 |
| Packet | [S4-B-doi-acquisition-ui.md](./S4-B-doi-acquisition-ui.md) |
| Result | Complete (local implementation; source COPY deferred) |
| Depends on | [S4-A status](./_status-S4-A.md) |
| Evidence | [jse-s4-ledger.md](../../provenance/jse-s4-ledger.md), `src/lib/__tests__/newsletter-doi-acquisition.test.ts` |

## Target paths

| Artifact | Path | Disposition used |
|---|---|---|
| Hero | `src/components/InlineNewsletterHero.tsx` | REIMPLEMENT |
| DOI form | `src/components/newsletter/DoiNewsletterSignupForm.tsx` | REIMPLEMENT (expected COPY+HARDEN; source unread) |
| Subscribe client | `src/lib/newsletter/subscribe-client.ts` | REIMPLEMENT (expected COPY+HARDEN; source unread) |
| Browser contract | `src/lib/newsletter/subscribe-browser-contract.ts` | implemented |
| Controller | `src/lib/newsletter/newsletter-signup-controller.ts` | implemented |
| Kill switch | `src/lib/newsletter/acquisition-kill-switch.ts` | implemented |
| Constants/copy | `src/lib/newsletter/doi-constants.ts` | provisional REIMPLEMENT |
| Homepage mount | `src/app/page.tsx` | adapted |

## Hardening / exclusions

- Same-origin only: `POST /api/newsletter/subscribe`.
- No `jackpot-api-newsletter` hostname in browser modules.
- No `/api/subscribe`, `email_signups`, reward/access-token, or soft-gate localStorage/cookie behavior.
- Consent + 21+ checkboxes unchecked by default.
- Non-enumerating accepted copy; bounded local status messages only.
- Kill-switch: `NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED === "true"` required; otherwise unavailable, no mutation, no legacy fallback.
- Honeypot field `website`; tripped bots get generic accepted UX without network call.
- BFF route handlers intentionally **not** implemented (S4-C).

## Source SHAs

| Item | Value |
|---|---|
| Intended functional source baseline | `466bfb065a9c34010ee0f0de22b419299259fa46` |
| Source files read at baseline | **No** — `rewards-maxxing-frontend` inaccessible from this environment |
| Product copy / EC-05A | Provisional local copy pending upstream verification |

## Tests

```text
npm test
npm run typecheck
```

Focused coverage in `newsletter-doi-acquisition.test.ts`: validation gates, one BFF call, generic success/error, in-flight guard, kill-switch, static markup, source-graph scans.

## Acceptance checklist

- [x] Hero is reimplemented from allowlisted product/task intent (source unread).
- [x] DOI form uses same-origin submission only.
- [x] Required consent and age evidence represented (unchecked by default).
- [x] Generic/non-enumerating success UX preserved.
- [x] No legacy fallback writer or `/api/subscribe` path.
- [x] No direct browser→newsletter-service request.
- [x] No legacy access/reward-token or signup-cookie/localStorage behavior.
- [x] Kill-switch/unavailable behavior without fallback persistence.
- [x] Focused UI/client tests pass.
- [x] No hosted deployment or real mutation required/performed.

## Follow-ups

- When source access lands: diff REIMPLEMENT form/client against `466bfb0` COPY+HARDEN intent and record any product-copy corrections.
- S4-C: implement BFF handlers matching [s4-newsletter-contract-matrix.md](./s4-newsletter-contract-matrix.md).
