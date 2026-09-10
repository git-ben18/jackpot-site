/**
 * Server-only newsletter-service destination. Never expose via NEXT_PUBLIC_*.
 */
import 'server-only'

export const NEWSLETTER_SERVICE_BASE_URL_ENV = 'NEWSLETTER_SERVICE_BASE_URL'

export type NewsletterServiceEnv =
  | { ok: true; baseUrl: string }
  | { ok: false; reason: 'missing_config' }

export function resolveNewsletterServiceEnv(
  env: Record<string, string | undefined> = process.env,
): NewsletterServiceEnv {
  const raw = env[NEWSLETTER_SERVICE_BASE_URL_ENV]?.trim()
  if (!raw) {
    return { ok: false, reason: 'missing_config' }
  }
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { ok: false, reason: 'missing_config' }
    }
  } catch {
    return { ok: false, reason: 'missing_config' }
  }
  return { ok: true, baseUrl: raw.replace(/\/+$/, '') }
}

export function joinNewsletterServiceUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`
}
