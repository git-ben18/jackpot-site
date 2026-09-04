import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  readPublicSupabaseConfig,
  type PublicSupabaseConfig,
  type PublicSupabaseKeyKind,
} from "./publicSupabaseConfig";

export type PublicSupabaseClientResult =
  | { ok: true; client: SupabaseClient; keyKind: PublicSupabaseKeyKind }
  | Extract<PublicSupabaseConfig, { ok: false }>;

export function createPublicSupabaseClient(): PublicSupabaseClientResult {
  const config = readPublicSupabaseConfig();
  if (!config.ok) return config;

  return {
    ok: true,
    keyKind: config.keyKind,
    client: createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

export { readPublicSupabaseConfig } from "./publicSupabaseConfig";
