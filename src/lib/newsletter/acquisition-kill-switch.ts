import { NEWSLETTER_DOI_ENABLED_ENV } from "./doi-constants";

/**
 * Acquisition kill-switch. When disabled, UI must not call the BFF and must
 * not fall back to any legacy writer.
 */
export function isNewsletterDoiAcquisitionEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env[NEWSLETTER_DOI_ENABLED_ENV] === "true";
}
