/**
 * COPY + HARDEN from rewards-maxxing-frontend subscribe-client.ts
 * Hardening: frozen browser `{ status }` contract; same-origin BFF only;
 * no source consent-text-version field; never treat arbitrary 2xx as success.
 */
import {
  type BrowserSignupSource,
  type BrowserSubscribeRequest,
  type SubscribeBrowserStatus,
  NEWSLETTER_CONSENT_POLICY_VERSION,
} from './newsletter-public-contract'

export const NEWSLETTER_SUBSCRIBE_BFF_PATH = '/api/newsletter/subscribe' as const

export type SubscribeClientDeps = {
  fetchImpl?: typeof fetch
}

export type SubscribeClientInput = {
  email: string
  consentAccepted: boolean
  ageConfirmed: boolean
  signupSource: BrowserSignupSource
  /** Honeypot — empty string or omit for real visitors. */
  website?: string
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

function mapHttpToStatus(
  httpStatus: number,
  bodyStatus: string | null,
): SubscribeBrowserStatus {
  if (bodyStatus === 'accepted' && httpStatus === 200) return 'accepted'
  if (bodyStatus === 'rate_limited' && httpStatus === 429) return 'rate_limited'
  if (bodyStatus === 'invalid' && (httpStatus === 400 || httpStatus === 413)) {
    return 'invalid'
  }
  if (bodyStatus === 'unavailable') return 'unavailable'

  if (httpStatus === 400 || httpStatus === 413) return 'invalid'
  if (httpStatus === 429) return 'rate_limited'
  return 'unavailable'
}

/**
 * POST-only subscribe against the same-origin BFF.
 * Caller must already require consent + age; this builds the frozen DTO.
 */
export async function subscribeNewsletter(
  input: SubscribeClientInput,
  deps: SubscribeClientDeps = {},
): Promise<SubscribeBrowserStatus> {
  if (!input.consentAccepted || !input.ageConfirmed) {
    return 'invalid'
  }

  const body: BrowserSubscribeRequest = {
    email: input.email.trim(),
    consentAccepted: true,
    ageConfirmed: true,
    consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
    signupSource: input.signupSource,
  }
  if (typeof input.website === 'string') {
    body.website = input.website
  }

  const fetchImpl = deps.fetchImpl ?? fetch
  let res: Response
  try {
    res = await fetchImpl(NEWSLETTER_SUBSCRIBE_BFF_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return 'unavailable'
  }

  const parsed = statusFromBody(await readJson(res))
  return mapHttpToStatus(res.status, parsed)
}
