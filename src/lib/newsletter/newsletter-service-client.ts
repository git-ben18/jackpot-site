/**
 * Server-only newsletter-service transport.
 * REIMPLEMENT of source core-proxy authenticated fetch — new name, canonical DTOs,
 * fail-closed identity attachment (S4-D fills the auth provider).
 */
import 'server-only'

import {
  CANONICAL_CONFIRM_PATH,
  CANONICAL_CONFIRM_VALIDATE_PATH,
  CANONICAL_SUBSCRIBE_PATH,
  parseCanonicalConsumeResponse,
  parseCanonicalSubscribeError,
  parseCanonicalSubscribeSuccess,
  parseCanonicalValidateResponse,
  type CanonicalConfirmTokenInput,
  type CanonicalConsumeResponse,
  type CanonicalSubscribeError,
  type CanonicalSubscribeInput,
  type CanonicalSubscribeSuccess,
  type CanonicalValidateResponse,
} from './newsletter-canonical-contract'
import {
  createDeferredWorkloadIdentityAuth,
  type NewsletterServiceAuth,
} from './newsletter-service-auth'
import {
  joinNewsletterServiceUrl,
  resolveNewsletterServiceEnv,
} from './newsletter-service-env'

export const UPSTREAM_TIMEOUT_MS = 10_000

export type SubscribeTransportResult =
  | { kind: 'success'; value: CanonicalSubscribeSuccess }
  | { kind: 'error'; error: CanonicalSubscribeError }
  | {
      kind: 'unavailable'
      cause:
        | 'timeout'
        | 'network'
        | 'unauthorized'
        | 'malformed'
        | 'unknown_status'
        | 'missing_config'
        | 'identity_unavailable'
    }

export type ConfirmValidateTransportResult =
  | { kind: 'success'; value: CanonicalValidateResponse }
  | {
      kind: 'unavailable'
      cause:
        | 'timeout'
        | 'network'
        | 'unauthorized'
        | 'malformed'
        | 'unknown_status'
        | 'missing_config'
        | 'identity_unavailable'
    }

export type ConfirmConsumeTransportResult =
  | { kind: 'success'; value: CanonicalConsumeResponse }
  | {
      kind: 'unavailable'
      cause:
        | 'timeout'
        | 'network'
        | 'unauthorized'
        | 'malformed'
        | 'unknown_status'
        | 'missing_config'
        | 'identity_unavailable'
    }

export type NewsletterServiceTransport = {
  subscribe(input: CanonicalSubscribeInput): Promise<SubscribeTransportResult>
  validateConfirmation(
    input: CanonicalConfirmTokenInput,
  ): Promise<ConfirmValidateTransportResult>
  confirm(input: CanonicalConfirmTokenInput): Promise<ConfirmConsumeTransportResult>
}

export type NewsletterHttpTransportDeps = {
  env?: Record<string, string | undefined>
  auth?: NewsletterServiceAuth
  fetchImpl?: typeof fetch
  nowTimeoutMs?: number
}

export function createHttpNewsletterServiceTransport(
  deps: NewsletterHttpTransportDeps = {},
): NewsletterServiceTransport {
  const auth = deps.auth ?? createDeferredWorkloadIdentityAuth()
  const fetchImpl = deps.fetchImpl ?? fetch
  const timeoutMs = deps.nowTimeoutMs ?? UPSTREAM_TIMEOUT_MS

  async function authorizedPost(
    path: string,
    jsonBody: unknown,
  ): Promise<
    | { kind: 'http'; httpStatus: number; body: unknown }
    | Extract<SubscribeTransportResult, { kind: 'unavailable' }>
  > {
    const env = resolveNewsletterServiceEnv(deps.env)
    if (!env.ok) {
      return { kind: 'unavailable', cause: 'missing_config' }
    }

    const headersResult = await auth.getHeaders()
    if (!headersResult.ok) {
      return { kind: 'unavailable', cause: 'identity_unavailable' }
    }

    const url = joinNewsletterServiceUrl(env.baseUrl, path)
    let response: Response
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headersResult.headers,
        },
        body: JSON.stringify(jsonBody),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (isTimeoutError(error)) {
        return { kind: 'unavailable', cause: 'timeout' }
      }
      return { kind: 'unavailable', cause: 'network' }
    }

    if (response.status === 401 || response.status === 403) {
      return { kind: 'unavailable', cause: 'unauthorized' }
    }

    let body: unknown
    try {
      body = await response.json()
    } catch {
      return { kind: 'unavailable', cause: 'malformed' }
    }

    return { kind: 'http', httpStatus: response.status, body }
  }

  return {
    async subscribe(input) {
      const posted = await authorizedPost(CANONICAL_SUBSCRIBE_PATH, input)
      if (posted.kind === 'unavailable') return posted

      // Body shape alone is not authority — httpStatus must agree.
      if (isHttpSuccessStatus(posted.httpStatus)) {
        const success = parseCanonicalSubscribeSuccess(posted.body)
        if (success) return { kind: 'success', value: success }
        // Unknown / error-shaped / malformed 2xx must fail closed.
        return { kind: 'unavailable', cause: 'unknown_status' }
      }

      const error = parseCanonicalSubscribeError(posted.body)
      if (error) return { kind: 'error', error }

      return { kind: 'unavailable', cause: 'unknown_status' }
    },

    async validateConfirmation(input) {
      const posted = await authorizedPost(CANONICAL_CONFIRM_VALIDATE_PATH, input)
      if (posted.kind === 'unavailable') return posted

      if (!isHttpSuccessStatus(posted.httpStatus)) {
        return { kind: 'unavailable', cause: 'unknown_status' }
      }

      const parsed = parseCanonicalValidateResponse(posted.body)
      if (parsed) return { kind: 'success', value: parsed }
      return { kind: 'unavailable', cause: 'unknown_status' }
    },

    async confirm(input) {
      const posted = await authorizedPost(CANONICAL_CONFIRM_PATH, input)
      if (posted.kind === 'unavailable') return posted

      if (!isHttpSuccessStatus(posted.httpStatus)) {
        return { kind: 'unavailable', cause: 'unknown_status' }
      }

      const parsed = parseCanonicalConsumeResponse(posted.body)
      if (parsed) return { kind: 'success', value: parsed }
      return { kind: 'unavailable', cause: 'unknown_status' }
    },
  }
}

function isHttpSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'TimeoutError'
  )
}
