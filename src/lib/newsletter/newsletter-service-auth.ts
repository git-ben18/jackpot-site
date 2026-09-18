/**
 * Server-only workload identity for BFF → jackpot-api-newsletter.
 * S4-D fills the S4-C auth seam. Hosted Vercel OIDC acceptance remains deferred.
 */
import 'server-only'

import { getVercelOidcToken } from '@vercel/oidc'

export const WORKLOAD_IDENTITY_AUTHORIZATION_HEADER = 'Authorization' as const
export const WORKLOAD_IDENTITY_AUTH_SCHEME = 'Bearer' as const
/**
 * Vercel Deployment Protection Trusted Sources header.
 * Same OIDC JWT as Authorization — edge consumes this; newsletter app verifies Bearer.
 */
export const WORKLOAD_IDENTITY_TRUSTED_OIDC_IDP_HEADER =
  'x-vercel-trusted-oidc-idp-token' as const

export type NewsletterServiceAuthResult =
  | { ok: true; headers: Record<string, string> }
  | {
      ok: false
      reason: 'identity_unavailable' | 'misconfigured' | 'forbidden_in_production'
    }

export type NewsletterServiceAuth = {
  /** Present on S4-D providers; optional for test stubs. */
  readonly mode?: 'vercel_oidc' | 'fake_test' | 'deferred'
  getHeaders: () => Promise<NewsletterServiceAuthResult>
}

export type ResolveWorkloadIdentityAuthOptions = {
  env?: Record<string, string | undefined>
  /** Test seam — production always calls `getVercelOidcToken()` with no audience. */
  getVercelOidcTokenFn?: () => Promise<string>
  logError?: (message: string) => void
}

function defaultLogError(message: string): void {
  // Bounded auth state only — never log assertions/tokens.
  console.error(`[newsletter-service-auth] ${message}`)
}

function isHostedNonDevRuntime(env: Record<string, string | undefined>): boolean {
  const vercelEnv = env.VERCEL_ENV?.trim()
  return vercelEnv === 'production' || vercelEnv === 'preview'
}

function isProductionNode(env: Record<string, string | undefined>): boolean {
  return env.NODE_ENV === 'production'
}

/** Fake/test identity is allowed only for explicit local/test configuration. */
export function isFakeWorkloadIdentityAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isProductionNode(env) || isHostedNonDevRuntime(env)) {
    return false
  }
  return env.NEWSLETTER_WORKLOAD_IDENTITY_MODE?.trim() === 'fake'
}

function authorizationHeaders(assertion: string): Record<string, string> {
  return {
    [WORKLOAD_IDENTITY_AUTHORIZATION_HEADER]: `${WORKLOAD_IDENTITY_AUTH_SCHEME} ${assertion}`,
    // Trusted Sources (perimeter) + EB-03 Authorization (application) share one token.
    [WORKLOAD_IDENTITY_TRUSTED_OIDC_IDP_HEADER]: assertion,
  }
}

/**
 * Explicit always-fail provider retained for tests and fail-closed defaults.
 */
export function createDeferredWorkloadIdentityAuth(): NewsletterServiceAuth {
  return {
    mode: 'deferred',
    async getHeaders() {
      return { ok: false, reason: 'identity_unavailable' }
    },
  }
}

export function createFakeWorkloadIdentityAuth(
  assertion: string,
): NewsletterServiceAuth {
  return {
    mode: 'fake_test',
    async getHeaders() {
      const trimmed = assertion.trim()
      if (!trimmed) {
        return { ok: false, reason: 'misconfigured' }
      }
      return { ok: true, headers: authorizationHeaders(trimmed) }
    },
  }
}

function createForbiddenFakeAuth(): NewsletterServiceAuth {
  return {
    mode: 'fake_test',
    async getHeaders() {
      return { ok: false, reason: 'forbidden_in_production' }
    },
  }
}

/**
 * Acquire the default Vercel OIDC JWT (no custom audience).
 *
 * A custom audience triggers Vercel's audience exchange; the exchanged token's
 * issuer becomes the team-scoped issuer (`https://oidc.vercel.com/<team>`),
 * which will fail verification when jackpot-api-newsletter is configured for
 * the global issuer (`https://oidc.vercel.com`). Hosted Acceptance therefore
 * must call `getVercelOidcToken()` with no options.
 */
export function createVercelOidcWorkloadIdentityAuth(options: {
  getVercelOidcTokenFn?: () => Promise<string>
  logError?: (message: string) => void
} = {}): NewsletterServiceAuth {
  const getToken = options.getVercelOidcTokenFn ?? getVercelOidcToken
  const logError = options.logError ?? defaultLogError

  return {
    mode: 'vercel_oidc',
    async getHeaders() {
      try {
        const assertion = await getToken()
        const trimmed = typeof assertion === 'string' ? assertion.trim() : ''
        if (!trimmed) {
          logError('identity_unavailable')
          return { ok: false, reason: 'identity_unavailable' }
        }
        return { ok: true, headers: authorizationHeaders(trimmed) }
      } catch {
        logError('identity_unavailable')
        return { ok: false, reason: 'identity_unavailable' }
      }
    },
  }
}

/**
 * Resolve the active auth provider for live HTTP transport.
 * Default: Vercel OIDC. Fake mode requires explicit non-production configuration.
 */
export function resolveWorkloadIdentityAuth(
  options: ResolveWorkloadIdentityAuthOptions = {},
): NewsletterServiceAuth {
  const env = options.env ?? process.env
  const logError = options.logError ?? defaultLogError
  const requestedMode = env.NEWSLETTER_WORKLOAD_IDENTITY_MODE?.trim()

  if (requestedMode === 'fake') {
    if (!isFakeWorkloadIdentityAllowed(env)) {
      logError('forbidden_in_production')
      return createForbiddenFakeAuth()
    }
    return createFakeWorkloadIdentityAuth(
      env.NEWSLETTER_WORKLOAD_IDENTITY_FAKE_ASSERTION ?? 'local-test-workload-assertion',
    )
  }

  if (requestedMode && requestedMode !== 'vercel_oidc') {
    logError('misconfigured')
    return {
      mode: 'vercel_oidc',
      async getHeaders() {
        return { ok: false, reason: 'misconfigured' }
      },
    }
  }

  // Intentionally ignore NEWSLETTER_WORKLOAD_OIDC_AUDIENCE if present in env:
  // custom audience changes the OIDC issuer and breaks global-issuer verification.
  return createVercelOidcWorkloadIdentityAuth({
    getVercelOidcTokenFn: options.getVercelOidcTokenFn,
    logError,
  })
}
