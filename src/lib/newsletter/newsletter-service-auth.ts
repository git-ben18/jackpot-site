/**
 * Workload-identity attachment seam for S4-D.
 * S4-C fail-closes on the live HTTP path; tests inject a fake transport.
 */
import 'server-only'

export type NewsletterServiceAuthResult =
  | { ok: true; headers: Record<string, string> }
  | { ok: false; reason: 'identity_unavailable' }

export type NewsletterServiceAuth = {
  getHeaders: () => Promise<NewsletterServiceAuthResult>
}

/**
 * Default until S4-D wires Vercel OIDC. Must not allow anonymous mutation calls.
 */
export function createDeferredWorkloadIdentityAuth(): NewsletterServiceAuth {
  return {
    async getHeaders() {
      return { ok: false, reason: 'identity_unavailable' }
    },
  }
}
