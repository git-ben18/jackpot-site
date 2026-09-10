/**
 * COPY + HARDEN from rewards-maxxing-frontend confirm-client.ts
 * Hardening: frozen browser `{ status }` contract (not source `outcome` / `valid`).
 * Same-origin BFF only. Never log the token.
 */
import {
  CONFIRM_CONSUME_BROWSER_STATUSES,
  CONFIRM_VALIDATE_BROWSER_STATUSES,
  type ConfirmConsumeBrowserStatus,
  type ConfirmValidateBrowserStatus,
} from './newsletter-public-contract'

export const NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH =
  '/api/newsletter/confirm/validate' as const
export const NEWSLETTER_CONFIRM_CONSUME_BFF_PATH =
  '/api/newsletter/confirm' as const
export const NEWSLETTER_CONFIRM_PATH = '/newsletter/confirm' as const

const VALIDATE_STATUS_SET = new Set<string>(CONFIRM_VALIDATE_BROWSER_STATUSES)
const CONSUME_STATUS_SET = new Set<string>(CONFIRM_CONSUME_BROWSER_STATUSES)

export type ConfirmClientDeps = {
  fetchImpl?: typeof fetch
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function statusFromBody(body: unknown): string | null {
  if (!isRecord(body) || typeof body.status !== 'string') return null
  return body.status
}

/**
 * POST-only validate. Empty token → invalid_or_unusable without network.
 * Unknown/malformed 2xx → unable_to_confirm (never ready_to_confirm).
 */
export async function validateConfirmToken(
  token: string,
  deps: ConfirmClientDeps = {},
): Promise<ConfirmValidateBrowserStatus> {
  if (token.length === 0) return 'invalid_or_unusable'

  const fetchImpl = deps.fetchImpl ?? fetch
  let res: Response
  try {
    res = await fetchImpl(NEWSLETTER_CONFIRM_VALIDATE_BFF_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    return 'unable_to_confirm'
  }

  if (res.status === 429 || res.status >= 500) return 'unable_to_confirm'
  if (res.status === 400 || res.status === 404 || res.status === 410) {
    return 'invalid_or_unusable'
  }
  if (res.status !== 200 && res.status !== 202) return 'unable_to_confirm'

  const status = statusFromBody(await readJson(res))
  if (status && VALIDATE_STATUS_SET.has(status)) {
    return status as ConfirmValidateBrowserStatus
  }
  // Reject source synonym `valid` and any unknown vocabulary.
  return 'unable_to_confirm'
}

/**
 * POST-only consume. Empty token → invalid_or_unusable without network.
 * Unknown/malformed 2xx → unable_to_confirm (never success).
 */
export async function consumeConfirmToken(
  token: string,
  deps: ConfirmClientDeps = {},
): Promise<ConfirmConsumeBrowserStatus> {
  if (token.length === 0) return 'invalid_or_unusable'

  const fetchImpl = deps.fetchImpl ?? fetch
  let res: Response
  try {
    res = await fetchImpl(NEWSLETTER_CONFIRM_CONSUME_BFF_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    return 'unable_to_confirm'
  }

  if (res.status === 429 || res.status >= 500) return 'unable_to_confirm'
  if (res.status === 400 || res.status === 404 || res.status === 410) {
    return 'invalid_or_unusable'
  }
  if (res.status !== 200 && res.status !== 202) return 'unable_to_confirm'

  const status = statusFromBody(await readJson(res))
  if (status && CONSUME_STATUS_SET.has(status)) {
    return status as ConfirmConsumeBrowserStatus
  }
  return 'unable_to_confirm'
}
