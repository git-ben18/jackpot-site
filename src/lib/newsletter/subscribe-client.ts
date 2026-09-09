import { NEWSLETTER_SUBSCRIBE_BFF_PATH } from "./doi-constants";
import {
  parseSubscribeBrowserResponse,
  type NewsletterSubscribeBrowserRequest,
  type NewsletterSubscribeBrowserResponse,
} from "./subscribe-browser-contract";

export type SubscribeClientResult = NewsletterSubscribeBrowserResponse;

/**
 * Same-origin subscribe client. Never targets the newsletter-service hostname.
 */
export async function subscribeNewsletter(
  body: NewsletterSubscribeBrowserRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<SubscribeClientResult> {
  try {
    const response = await fetchImpl(NEWSLETTER_SUBSCRIBE_BFF_PATH, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        consentAccepted: body.consentAccepted,
        ageConfirmed: body.ageConfirmed,
        consentPolicyVersion: body.consentPolicyVersion,
        signupSource: body.signupSource,
        website: body.website ?? "",
      }),
      credentials: "same-origin",
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return parseSubscribeBrowserResponse(payload);
  } catch {
    return { status: "error" };
  }
}
