/**
 * Same-origin newsletter BFF pipeline (S4-C).
 * Validates browser DTOs, translates to canonical service DTOs, sanitizes responses.
 */
import 'server-only'

import { NextResponse } from 'next/server'

import {
  isBrowserSignupSource,
  NEWSLETTER_CONSENT_POLICY_VERSION,
  type BrowserConfirmConsumeResponse,
  type BrowserConfirmValidateResponse,
  type BrowserSubscribeRequest,
  type BrowserSubscribeResponse,
} from './newsletter-public-contract'
import {
  isRecord,
  translateBrowserSubscribeToCanonical,
} from './newsletter-canonical-contract'
import { resolveWorkloadIdentityAuth } from './newsletter-service-auth'
import {
  createHttpNewsletterServiceTransport,
  type NewsletterServiceTransport,
} from './newsletter-service-client'
import { isNewsletterAcquisitionEnabled } from './newsletter-acquisition-gate'

export const MAX_PUBLIC_JSON_BYTES = 4096

export const CONFIRM_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
} as const

const SUBSCRIBE_ALLOWED_KEYS = new Set([
  'email',
  'consentAccepted',
  'ageConfirmed',
  'consentPolicyVersion',
  'signupSource',
  'website',
])

const CONFIRM_ALLOWED_KEYS = new Set(['token'])

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/

export type NewsletterBffLogger = {
  error: (message: string) => void
}

export type NewsletterBffDeps = {
  transport?: NewsletterServiceTransport
  log?: NewsletterBffLogger
  /** Injected for tests; defaults to server kill-switch env gate. */
  isAcquisitionEnabled?: () => boolean
}

const defaultLogger: NewsletterBffLogger = {
  error: (message) => {
    console.error(message)
  },
}

function defaultTransport(): NewsletterServiceTransport {
  return createHttpNewsletterServiceTransport({
    auth: resolveWorkloadIdentityAuth(),
  })
}

function acquisitionAllowed(deps: NewsletterBffDeps): boolean {
  return deps.isAcquisitionEnabled?.() ?? isNewsletterAcquisitionEnabled()
}

export type ParsedJson =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 }

export async function readBoundedJsonBody(
  request: Request,
  maxBytes = MAX_PUBLIC_JSON_BYTES,
): Promise<ParsedJson> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, status: 400 }
  }

  const raw = await request.text()
  if (raw.length > maxBytes) {
    return { ok: false, status: 413 }
  }

  try {
    return { ok: true, body: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false, status: 400 }
  }
}

export type SubscribeParseResult =
  | { ok: true; value: BrowserSubscribeRequest; honeypotTriggered: boolean }
  | { ok: false }

export function parseBrowserSubscribeBody(body: unknown): SubscribeParseResult {
  if (!isRecord(body)) return { ok: false }

  for (const key of Object.keys(body)) {
    if (!SUBSCRIBE_ALLOWED_KEYS.has(key)) return { ok: false }
  }

  const website = body.website
  if (website !== undefined && typeof website !== 'string') {
    return { ok: false }
  }
  if (typeof website === 'string' && website.trim() !== '') {
    return { ok: true, value: dummySubscribeForHoneypot(), honeypotTriggered: true }
  }

  if (typeof body.email !== 'string') return { ok: false }
  const email = body.email.trim()
  if (email.length < 3 || email.length > 320 || !EMAIL_PATTERN.test(email)) {
    return { ok: false }
  }

  if (body.consentAccepted !== true) return { ok: false }
  if (body.ageConfirmed !== true) return { ok: false }
  if (body.consentPolicyVersion !== NEWSLETTER_CONSENT_POLICY_VERSION) {
    return { ok: false }
  }
  if (!isBrowserSignupSource(body.signupSource)) return { ok: false }

  return {
    ok: true,
    honeypotTriggered: false,
    value: {
      email,
      consentAccepted: true,
      ageConfirmed: true,
      consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
      signupSource: body.signupSource,
    },
  }
}

function dummySubscribeForHoneypot(): BrowserSubscribeRequest {
  return {
    email: 'honeypot@invalid.example',
    consentAccepted: true,
    ageConfirmed: true,
    consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
    signupSource: 'newsletter_landing',
  }
}

export type ConfirmParseResult =
  | { ok: true; token: string }
  | { ok: false }

export function parseBrowserConfirmBody(body: unknown): ConfirmParseResult {
  if (!isRecord(body)) return { ok: false }
  for (const key of Object.keys(body)) {
    if (!CONFIRM_ALLOWED_KEYS.has(key)) return { ok: false }
  }
  if (typeof body.token !== 'string') return { ok: false }
  if (body.token.length < 16 || body.token.length > 128) return { ok: false }
  if (!TOKEN_PATTERN.test(body.token)) return { ok: false }
  return { ok: true, token: body.token }
}

export async function handleSubscribePost(
  request: Request,
  deps: NewsletterBffDeps = {},
): Promise<NextResponse<BrowserSubscribeResponse>> {
  const parsed = await readBoundedJsonBody(request)
  if (!parsed.ok) {
    return NextResponse.json({ status: 'invalid' }, { status: parsed.status })
  }

  const browser = parseBrowserSubscribeBody(parsed.body)
  if (!browser.ok) {
    return NextResponse.json({ status: 'invalid' }, { status: 400 })
  }

  if (browser.honeypotTriggered) {
    return NextResponse.json({ status: 'accepted' }, { status: 200 })
  }

  if (!acquisitionAllowed(deps)) {
    const log = deps.log ?? defaultLogger
    log.error('newsletter subscribe unavailable')
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }

  const transport = deps.transport ?? defaultTransport()
  const canonical = translateBrowserSubscribeToCanonical(browser.value)
  const result = await transport.subscribe(canonical)

  if (result.kind === 'success') {
    return NextResponse.json({ status: 'accepted' }, { status: 200 })
  }
  if (result.kind === 'error') {
    if (result.error.error === 'rate_limited') {
      return NextResponse.json({ status: 'rate_limited' }, { status: 429 })
    }
    if (result.error.error === 'temporarily_unavailable') {
      return NextResponse.json({ status: 'unavailable' }, { status: 503 })
    }
    return NextResponse.json({ status: 'invalid' }, { status: 400 })
  }

  const log = deps.log ?? defaultLogger
  log.error('newsletter subscribe unavailable')
  return NextResponse.json({ status: 'unavailable' }, { status: 503 })
}

export async function handleConfirmValidatePost(
  request: Request,
  deps: NewsletterBffDeps = {},
): Promise<NextResponse<BrowserConfirmValidateResponse>> {
  const parsed = await readBoundedJsonBody(request)
  if (!parsed.ok) {
    return NextResponse.json(
      { status: 'invalid_or_unusable' },
      { status: parsed.status, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  const browser = parseBrowserConfirmBody(parsed.body)
  if (!browser.ok) {
    return NextResponse.json(
      { status: 'invalid_or_unusable' },
      { status: 400, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  if (!acquisitionAllowed(deps)) {
    const log = deps.log ?? defaultLogger
    log.error('newsletter confirm validate unavailable')
    return NextResponse.json(
      { status: 'unable_to_confirm' },
      { status: 503, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  const transport = deps.transport ?? defaultTransport()
  const result = await transport.validateConfirmation({ token: browser.token })
  if (result.kind === 'success') {
    return NextResponse.json(
      { status: result.value.status },
      { status: 200, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  const log = deps.log ?? defaultLogger
  log.error('newsletter confirm validate unavailable')
  return NextResponse.json(
    { status: 'unable_to_confirm' },
    { status: 503, headers: CONFIRM_NO_STORE_HEADERS },
  )
}

export async function handleConfirmConsumePost(
  request: Request,
  deps: NewsletterBffDeps = {},
): Promise<NextResponse<BrowserConfirmConsumeResponse>> {
  const parsed = await readBoundedJsonBody(request)
  if (!parsed.ok) {
    return NextResponse.json(
      { status: 'invalid_or_unusable' },
      { status: parsed.status, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  const browser = parseBrowserConfirmBody(parsed.body)
  if (!browser.ok) {
    return NextResponse.json(
      { status: 'invalid_or_unusable' },
      { status: 400, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  if (!acquisitionAllowed(deps)) {
    const log = deps.log ?? defaultLogger
    log.error('newsletter confirm consume unavailable')
    return NextResponse.json(
      { status: 'unable_to_confirm' },
      { status: 503, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  const transport = deps.transport ?? defaultTransport()
  const result = await transport.confirm({ token: browser.token })
  if (result.kind === 'success') {
    return NextResponse.json(
      { status: result.value.status },
      { status: 200, headers: CONFIRM_NO_STORE_HEADERS },
    )
  }

  const log = deps.log ?? defaultLogger
  log.error('newsletter confirm consume unavailable')
  return NextResponse.json(
    { status: 'unable_to_confirm' },
    { status: 503, headers: CONFIRM_NO_STORE_HEADERS },
  )
}

export function methodNotAllowedSubscribe(): NextResponse<BrowserSubscribeResponse> {
  return NextResponse.json({ status: 'unavailable' }, { status: 405 })
}

export function methodNotAllowedConfirmValidate(): NextResponse<BrowserConfirmValidateResponse> {
  return NextResponse.json(
    { status: 'invalid_or_unusable' },
    { status: 405, headers: CONFIRM_NO_STORE_HEADERS },
  )
}

export function methodNotAllowedConfirmConsume(): NextResponse<BrowserConfirmConsumeResponse> {
  return NextResponse.json(
    { status: 'invalid_or_unusable' },
    { status: 405, headers: CONFIRM_NO_STORE_HEADERS },
  )
}
