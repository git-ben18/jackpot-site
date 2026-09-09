import { NEWSLETTER_DOI_ENABLED_ENV } from "./doi-constants";

/**
 * Acquisition kill-switch. When disabled, UI must not call the BFF and must
 * not fall back to any legacy writer.
 *
 * Default path uses a static `process.env.NEXT_PUBLIC_*` read so Next can
 * inline the value into the browser bundle.
 */
export function isNewsletterDoiAcquisitionEnabled(
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>,
): boolean {
  if (env) {
    return env[NEWSLETTER_DOI_ENABLED_ENV] === "true";
  }

  return process.env.NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED === "true";
}
