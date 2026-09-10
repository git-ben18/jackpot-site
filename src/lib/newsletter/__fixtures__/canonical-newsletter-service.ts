/**
 * Controlled local/test canonical newsletter-service fixture for S4-G.
 * Emulates frozen jackpot-api-newsletter public contract paths/bodies.
 * Not a production dependency and not a network client.
 */
import {
  CANONICAL_CONFIRM_PATH,
  CANONICAL_CONFIRM_VALIDATE_PATH,
  CANONICAL_SUBSCRIBE_PATH,
  type CanonicalConfirmTokenInput,
  type CanonicalSubscribeInput,
} from '../newsletter-canonical-contract'
import { NEWSLETTER_CHECK_EMAIL_COPY } from '../newsletter-public-contract'

export const FIXTURE_NEWSLETTER_SERVICE_ORIGIN =
  'https://fixture.newsletter.test' as const

export type FixtureSubscribeMode =
  | 'success_new'
  | 'success_pending'
  | 'success_known_suppressed'
  | 'rate_limited'
  | 'unauthorized'
  | 'forbidden'
  | 'server_error'
  | 'malformed_json'
  | 'unknown_success_status'
  | 'timeout'
  | 'network'

export type FixtureValidateMode =
  | 'ready_to_confirm'
  | 'already_complete'
  | 'invalid_or_unusable'
  | 'unable_to_confirm'
  | 'malformed'
  | 'unknown_status'
  | 'unauthorized'
  | 'server_error'
  | 'timeout'
  | 'network'

export type FixtureConsumeMode =
  | 'success'
  | 'already_complete'
  | 'invalid_or_unusable'
  | 'unable_to_confirm'
  | 'malformed'
  | 'unknown_status'
  | 'unauthorized'
  | 'server_error'
  | 'timeout'
  | 'network'

export type CanonicalNewsletterFixtureState = {
  subscribeMode: FixtureSubscribeMode
  validateMode: FixtureValidateMode
  consumeMode: FixtureConsumeMode
  /** Captured upstream requests for assertions. */
  requests: Array<{
    path: string
    authorization: string | null
    body: unknown
  }>
}

export function createCanonicalNewsletterFixtureState(
  initial: Partial<
    Pick<
      CanonicalNewsletterFixtureState,
      'subscribeMode' | 'validateMode' | 'consumeMode'
    >
  > = {},
): CanonicalNewsletterFixtureState {
  return {
    subscribeMode: initial.subscribeMode ?? 'success_new',
    validateMode: initial.validateMode ?? 'ready_to_confirm',
    consumeMode: initial.consumeMode ?? 'success',
    requests: [],
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function pathFromUrl(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function requireAuth(init?: RequestInit): string | null {
  const headers = new Headers(init?.headers)
  return headers.get('Authorization')
}

async function readBody(init?: RequestInit): Promise<unknown> {
  if (!init?.body) return null
  try {
    return JSON.parse(String(init.body)) as unknown
  } catch {
    return null
  }
}

function throwMode(mode: string): never {
  if (mode === 'timeout') {
    const error = new Error('The operation was aborted due to timeout')
    error.name = 'TimeoutError'
    throw error
  }
  throw new Error('fixture network failure')
}

/**
 * fetchImpl for createHttpNewsletterServiceTransport — no real network.
 */
export function createCanonicalNewsletterFixtureFetch(
  state: CanonicalNewsletterFixtureState,
): typeof fetch {
  return async (input, init) => {
    const url = String(input)
    const path = pathFromUrl(url)
    const authorization = requireAuth(init)
    const body = await readBody(init)

    state.requests.push({ path, authorization, body })

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return jsonResponse(401, { ok: false, error: 'invalid_request' })
    }

    if (path === CANONICAL_SUBSCRIBE_PATH) {
      return handleSubscribe(state.subscribeMode, body as CanonicalSubscribeInput)
    }
    if (path === CANONICAL_CONFIRM_VALIDATE_PATH) {
      return handleValidate(state.validateMode, body as CanonicalConfirmTokenInput)
    }
    if (path === CANONICAL_CONFIRM_PATH) {
      return handleConsume(state.consumeMode, body as CanonicalConfirmTokenInput)
    }

    return jsonResponse(404, { ok: false, error: 'invalid_request' })
  }
}

function handleSubscribe(mode: FixtureSubscribeMode, _body: CanonicalSubscribeInput): Response {
  if (mode === 'timeout' || mode === 'network') throwMode(mode)
  if (mode === 'unauthorized') {
    return jsonResponse(401, { ok: false, error: 'invalid_request' })
  }
  if (mode === 'forbidden') {
    return jsonResponse(403, { ok: false, error: 'invalid_request' })
  }
  if (mode === 'rate_limited') {
    return jsonResponse(429, {
      ok: false,
      error: 'rate_limited',
      message: 'upstream-rate-detail-must-not-leak',
    })
  }
  if (mode === 'server_error') {
    return jsonResponse(503, {
      ok: false,
      error: 'temporarily_unavailable',
      message: 'upstream-db-detail-must-not-leak',
    })
  }
  if (mode === 'malformed_json') {
    return new Response('{not-json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (mode === 'unknown_success_status') {
    return jsonResponse(200, {
      ok: true,
      status: 'created_new_subscriber',
      message: NEWSLETTER_CHECK_EMAIL_COPY,
    })
  }

  // Non-enumerating public success — internal fixture labels differ only by mode selection;
  // the public body remains identical across success_* variants.
  return jsonResponse(200, {
    ok: true,
    status: 'confirmation_if_eligible',
    message: NEWSLETTER_CHECK_EMAIL_COPY,
  })
}

function handleValidate(
  mode: FixtureValidateMode,
  _body: CanonicalConfirmTokenInput,
): Response {
  if (mode === 'timeout' || mode === 'network') throwMode(mode)
  if (mode === 'unauthorized') {
    return jsonResponse(401, { status: 'unable_to_confirm' })
  }
  if (mode === 'server_error') {
    return jsonResponse(503, { status: 'unable_to_confirm' })
  }
  if (mode === 'malformed') {
    return new Response('{nope', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (mode === 'unknown_status') {
    return jsonResponse(200, { status: 'valid' })
  }
  return jsonResponse(200, { status: mode })
}

function handleConsume(
  mode: FixtureConsumeMode,
  _body: CanonicalConfirmTokenInput,
): Response {
  if (mode === 'timeout' || mode === 'network') throwMode(mode)
  if (mode === 'unauthorized') {
    return jsonResponse(401, { status: 'unable_to_confirm' })
  }
  if (mode === 'server_error') {
    return jsonResponse(503, { status: 'unable_to_confirm' })
  }
  if (mode === 'malformed') {
    return new Response('{nope', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (mode === 'unknown_status') {
    return jsonResponse(200, { status: 'confirmed_ok' })
  }
  return jsonResponse(200, { status: mode })
}
