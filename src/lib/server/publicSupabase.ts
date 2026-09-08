/**
 * Low-privilege server Supabase client for public curated reads.
 * Reads only SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (or explicit anon fallback).
 * Never reads service-role / secret credentials.
 *
 * Server-only by convention — import from Server Components / route handlers only.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type PublicSupabaseConfigError = {
  ok: false
  reason: 'missing_config'
  message: string
}

export type PublicSupabaseConfigOk = {
  ok: true
  url: string
  key: string
}

export type PublicSupabaseConfigResult = PublicSupabaseConfigOk | PublicSupabaseConfigError

/**
 * Resolve low-privilege credentials.
 * Prefer SUPABASE_PUBLISHABLE_KEY; allow SUPABASE_ANON_KEY only as explicit
 * documented compatibility fallback (same privilege class — never service-role).
 */
export function resolvePublicSupabaseConfig(
  env: Record<string, string | undefined> = process.env,
): PublicSupabaseConfigResult {
  const url = env.SUPABASE_URL?.trim()
  const publishable = env.SUPABASE_PUBLISHABLE_KEY?.trim()
  const anonFallback = env.SUPABASE_ANON_KEY?.trim()
  const key = publishable || anonFallback

  if (!url || !key) {
    return {
      ok: false,
      reason: 'missing_config',
      message:
        'Missing SUPABASE_URL and/or SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY compatibility fallback)',
    }
  }

  return { ok: true, url, key }
}

export function createPublicSupabaseClient(
  config: PublicSupabaseConfigOk,
): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getPublicSupabaseClient(
  env: Record<string, string | undefined> = process.env,
): SupabaseClient | PublicSupabaseConfigError {
  const config = resolvePublicSupabaseConfig(env)
  if (!config.ok) return config
  return createPublicSupabaseClient(config)
}
