/**
 * Canonical jackpot-api-newsletter DTOs and explicit BFF translation (S4-A).
 * Server-only. Do not copy source consentTextVersion / website / turnstileToken.
 */
import 'server-only'

import {
  NEWSLETTER_CONSENT_POLICY_VERSION,
  type BrowserSignupSource,
  type BrowserSubscribeRequest,
} from './newsletter-public-contract'

export const CANONICAL_SUBSCRIBE_PATH = '/api/public/newsletter/subscribe'
export const CANONICAL_CONFIRM_VALIDATE_PATH =
  '/api/public/newsletter/confirm/validate'
export const CANONICAL_CONFIRM_PATH = '/api/public/newsletter/confirm'

export const CANONICAL_SUBSCRIBE_ERROR_CODES = [
  'invalid_request',
  'invalid_email',
  'consent_required',
  'age_required',
  'rate_limited',
  'temporarily_unavailable',
] as const

export type CanonicalSubscribeErrorCode =
  (typeof CANONICAL_SUBSCRIBE_ERROR_CODES)[number]

export type CanonicalSubscribeInput = {
  email: string
  consentPolicyVersion: typeof NEWSLETTER_CONSENT_POLICY_VERSION
  consentAccepted: true
  ageConfirmed: true
  signupSource: BrowserSignupSource
}

export type CanonicalSubscribeSuccess = {
  ok: true
  status: 'confirmation_if_eligible'
  message: string
}

export type CanonicalSubscribeError = {
  ok: false
  error: CanonicalSubscribeErrorCode
  message?: string
}

export type CanonicalConfirmTokenInput = {
  token: string
}

export const CANONICAL_VALIDATE_STATUSES = [
  'ready_to_confirm',
  'already_complete',
  'invalid_or_unusable',
  'unable_to_confirm',
] as const

export type CanonicalValidateStatus = (typeof CANONICAL_VALIDATE_STATUSES)[number]

export type CanonicalValidateResponse = {
  status: CanonicalValidateStatus
}

export const CANONICAL_CONSUME_STATUSES = [
  'success',
  'already_complete',
  'invalid_or_unusable',
  'unable_to_confirm',
] as const

export type CanonicalConsumeStatus = (typeof CANONICAL_CONSUME_STATUSES)[number]

export type CanonicalConsumeResponse = {
  status: CanonicalConsumeStatus
}

export function translateBrowserSubscribeToCanonical(
  input: BrowserSubscribeRequest,
): CanonicalSubscribeInput {
  return {
    email: input.email,
    consentPolicyVersion: NEWSLETTER_CONSENT_POLICY_VERSION,
    consentAccepted: true,
    ageConfirmed: true,
    signupSource: input.signupSource,
  }
}

export function isCanonicalSubscribeErrorCode(
  value: unknown,
): value is CanonicalSubscribeErrorCode {
  return (
    typeof value === 'string' &&
    (CANONICAL_SUBSCRIBE_ERROR_CODES as readonly string[]).includes(value)
  )
}

export function isCanonicalValidateStatus(
  value: unknown,
): value is CanonicalValidateStatus {
  return (
    typeof value === 'string' &&
    (CANONICAL_VALIDATE_STATUSES as readonly string[]).includes(value)
  )
}

export function isCanonicalConsumeStatus(
  value: unknown,
): value is CanonicalConsumeStatus {
  return (
    typeof value === 'string' &&
    (CANONICAL_CONSUME_STATUSES as readonly string[]).includes(value)
  )
}

export function parseCanonicalSubscribeSuccess(
  body: unknown,
): CanonicalSubscribeSuccess | null {
  if (!isRecord(body)) return null
  if (body.ok !== true) return null
  if (body.status !== 'confirmation_if_eligible') return null
  if (typeof body.message !== 'string') return null
  return {
    ok: true,
    status: 'confirmation_if_eligible',
    message: body.message,
  }
}

export function parseCanonicalSubscribeError(
  body: unknown,
): CanonicalSubscribeError | null {
  if (!isRecord(body)) return null
  if (body.ok !== false) return null
  if (!isCanonicalSubscribeErrorCode(body.error)) return null
  return {
    ok: false,
    error: body.error,
    message: typeof body.message === 'string' ? body.message : undefined,
  }
}

export function parseCanonicalValidateResponse(
  body: unknown,
): CanonicalValidateResponse | null {
  if (!isRecord(body)) return null
  if (!isCanonicalValidateStatus(body.status)) return null
  return { status: body.status }
}

export function parseCanonicalConsumeResponse(
  body: unknown,
): CanonicalConsumeResponse | null {
  if (!isRecord(body)) return null
  if (!isCanonicalConsumeStatus(body.status)) return null
  return { status: body.status }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
