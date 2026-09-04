/**
 * Low-privilege public-read config for S3 curated discovery (D-S3-05).
 * Does not read service-role or secret keys, even if they are present.
 */

export const PUBLIC_SUPABASE_URL_ENV = "SUPABASE_URL";
export const PUBLIC_SUPABASE_PUBLISHABLE_KEY_ENV = "SUPABASE_PUBLISHABLE_KEY";
export const PUBLIC_SUPABASE_ANON_KEY_ENV = "SUPABASE_ANON_KEY";

export type PublicSupabaseKeyKind = "publishable" | "anon";

export type PublicSupabaseConfig =
  | {
      ok: true;
      url: string;
      key: string;
      keyKind: PublicSupabaseKeyKind;
    }
  | {
      ok: false;
      code: "missing_config";
      message: string;
    };

function readNonEmptyEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = readNonEmptyEnv(PUBLIC_SUPABASE_URL_ENV);
  const publishableKey = readNonEmptyEnv(PUBLIC_SUPABASE_PUBLISHABLE_KEY_ENV);
  const anonKey = readNonEmptyEnv(PUBLIC_SUPABASE_ANON_KEY_ENV);

  if (!url || (!publishableKey && !anonKey)) {
    return {
      ok: false,
      code: "missing_config",
      message: "Supabase public-read configuration is missing.",
    };
  }

  if (publishableKey) {
    return { ok: true, url, key: publishableKey, keyKind: "publishable" };
  }

  return { ok: true, url, key: anonKey as string, keyKind: "anon" };
}
