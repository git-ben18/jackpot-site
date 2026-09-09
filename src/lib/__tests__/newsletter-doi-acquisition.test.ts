import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import InlineNewsletterHero from "../../components/InlineNewsletterHero";
import DoiNewsletterSignupForm from "../../components/newsletter/DoiNewsletterSignupForm";
import { isNewsletterDoiAcquisitionEnabled } from "../newsletter/acquisition-kill-switch";
import {
  CONSENT_POLICY_VERSION,
  NEWSLETTER_COPY,
  NEWSLETTER_SUBSCRIBE_BFF_PATH,
} from "../newsletter/doi-constants";
import { createNewsletterSignupController } from "../newsletter/newsletter-signup-controller";
import { subscribeNewsletter } from "../newsletter/subscribe-client";
import {
  parseSubscribeBrowserResponse,
  validateSubscribeBrowserInput,
} from "../newsletter/subscribe-browser-contract";

const srcRoot = path.join(process.cwd(), "src");

function readSrc(...parts: string[]) {
  return readFileSync(path.join(srcRoot, ...parts), "utf8");
}

describe("S4-A/B newsletter browser contract", () => {
  it("accepts valid email + consent + age evidence", () => {
    const result = validateSubscribeBrowserInput({
      email: "  visitor@example.com ",
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: "newsletter_landing",
      website: "",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.email, "visitor@example.com");
      assert.equal(result.value.consentPolicyVersion, CONSENT_POLICY_VERSION);
      assert.equal(result.value.consentAccepted, true);
      assert.equal(result.value.ageConfirmed, true);
    }
  });

  it("rejects invalid email before any network concern", () => {
    const result = validateSubscribeBrowserInput({
      email: "not-an-email",
      consentAccepted: true,
      ageConfirmed: true,
      signupSource: "newsletter_landing",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.issue, "invalid_email");
    }
  });

  it("rejects missing consent and age before network", () => {
    const missingConsent = validateSubscribeBrowserInput({
      email: "visitor@example.com",
      consentAccepted: false,
      ageConfirmed: true,
      signupSource: "newsletter_landing",
    });
    assert.equal(missingConsent.ok, false);
    if (!missingConsent.ok) {
      assert.equal(missingConsent.issue, "missing_consent");
    }

    const missingAge = validateSubscribeBrowserInput({
      email: "visitor@example.com",
      consentAccepted: true,
      ageConfirmed: false,
      signupSource: "newsletter_landing",
    });
    assert.equal(missingAge.ok, false);
    if (!missingAge.ok) {
      assert.equal(missingAge.issue, "missing_age");
    }
  });

  it("parses only the narrow browser-safe status vocabulary", () => {
    assert.equal(parseSubscribeBrowserResponse({ status: "accepted" }).status, "accepted");
    assert.equal(
      parseSubscribeBrowserResponse({ status: "rate_limited" }).status,
      "rate_limited",
    );
    assert.equal(
      parseSubscribeBrowserResponse({ ok: true, created: true }).status,
      "error",
    );
    assert.equal(parseSubscribeBrowserResponse(null).status, "error");
  });
});

describe("S4-B same-origin subscribe client", () => {
  it("posts one same-origin BFF request for a valid body", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify({ status: "accepted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const result = await subscribeNewsletter(
      {
        email: "visitor@example.com",
        consentAccepted: true,
        ageConfirmed: true,
        consentPolicyVersion: CONSENT_POLICY_VERSION,
        signupSource: "newsletter_landing",
        website: "",
      },
      fetchImpl,
    );

    assert.equal(result.status, "accepted");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, NEWSLETTER_SUBSCRIBE_BFF_PATH);
    assert.equal(calls[0]?.init?.method, "POST");
    const body = JSON.parse(String(calls[0]?.init?.body));
    assert.equal(body.email, "visitor@example.com");
    assert.equal(body.consentAccepted, true);
    assert.equal(body.ageConfirmed, true);
  });

  it("treats arbitrary 2xx JSON without known status as error", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ success: true, subscriberId: "x" }), {
        status: 200,
      });

    const result = await subscribeNewsletter(
      {
        email: "visitor@example.com",
        consentAccepted: true,
        ageConfirmed: true,
        consentPolicyVersion: CONSENT_POLICY_VERSION,
        signupSource: "newsletter_landing",
      },
      fetchImpl,
    );

    assert.equal(result.status, "error");
  });

  it("maps network failure to generic error", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("offline");
    };

    const result = await subscribeNewsletter(
      {
        email: "visitor@example.com",
        consentAccepted: true,
        ageConfirmed: true,
        consentPolicyVersion: CONSENT_POLICY_VERSION,
        signupSource: "newsletter_landing",
      },
      fetchImpl,
    );

    assert.equal(result.status, "error");
  });
});

describe("S4-B newsletter signup controller", () => {
  it("valid email + consent/age creates exactly one BFF subscribe call", async () => {
    let calls = 0;
    const controller = createNewsletterSignupController({
      signupSource: "newsletter_landing",
      enabled: true,
      subscribe: async () => {
        calls += 1;
        return { status: "accepted" };
      },
    });

    controller.setValues({
      email: "visitor@example.com",
      consentAccepted: true,
      ageConfirmed: true,
    });

    const snap = await controller.submit();
    assert.equal(calls, 1);
    assert.equal(snap.state, "accepted");
    assert.equal(snap.statusMessage, NEWSLETTER_COPY.acceptedMessage);
  });

  it("rejects invalid email and missing evidence without calling subscribe", async () => {
    let calls = 0;
    const controller = createNewsletterSignupController({
      signupSource: "newsletter_landing",
      enabled: true,
      subscribe: async () => {
        calls += 1;
        return { status: "accepted" };
      },
    });

    controller.setValues({
      email: "bad",
      consentAccepted: true,
      ageConfirmed: true,
    });
    await controller.submit();
    assert.equal(calls, 0);
    assert.equal(controller.getSnapshot().fieldError, NEWSLETTER_COPY.invalidEmailMessage);

    controller.setValues({
      email: "ok@example.com",
      consentAccepted: false,
      ageConfirmed: true,
    });
    await controller.submit();
    assert.equal(calls, 0);
    assert.equal(
      controller.getSnapshot().fieldError,
      NEWSLETTER_COPY.missingConsentMessage,
    );

    controller.setValues({
      consentAccepted: true,
      ageConfirmed: false,
    });
    await controller.submit();
    assert.equal(calls, 0);
    assert.equal(controller.getSnapshot().fieldError, NEWSLETTER_COPY.missingAgeMessage);
  });

  it("renders generic error without exposing internals", async () => {
    const controller = createNewsletterSignupController({
      signupSource: "newsletter_landing",
      enabled: true,
      subscribe: async () => ({ status: "error" }),
    });
    controller.setValues({
      email: "visitor@example.com",
      consentAccepted: true,
      ageConfirmed: true,
    });
    const snap = await controller.submit();
    assert.equal(snap.state, "error");
    assert.equal(snap.statusMessage, NEWSLETTER_COPY.errorMessage);
    assert.equal(String(snap.statusMessage).includes("stack"), false);
  });

  it("ignores repeated submit while in-flight", async () => {
    let calls = 0;
    let release!: (value: { status: "accepted" }) => void;
    const gate = new Promise<{ status: "accepted" }>((resolve) => {
      release = resolve;
    });

    const controller = createNewsletterSignupController({
      signupSource: "newsletter_landing",
      enabled: true,
      subscribe: async () => {
        calls += 1;
        return gate;
      },
    });

    controller.setValues({
      email: "visitor@example.com",
      consentAccepted: true,
      ageConfirmed: true,
    });

    const first = controller.submit();
    const second = await controller.submit();
    assert.equal(second.inFlight, true);
    assert.equal(calls, 1);
    release({ status: "accepted" });
    await first;
    assert.equal(calls, 1);
  });

  it("kill-switch prevents mutation request", async () => {
    let calls = 0;
    const controller = createNewsletterSignupController({
      signupSource: "newsletter_landing",
      enabled: false,
      subscribe: async () => {
        calls += 1;
        return { status: "accepted" };
      },
    });

    controller.setValues({
      email: "visitor@example.com",
      consentAccepted: true,
      ageConfirmed: true,
    });
    const snap = await controller.submit();
    assert.equal(calls, 0);
    assert.equal(snap.state, "unavailable");
    assert.equal(snap.statusMessage, NEWSLETTER_COPY.unavailableMessage);
  });
});

describe("S4-B kill switch + static UI", () => {
  it("defaults acquisition to disabled unless env is exactly true", () => {
    assert.equal(isNewsletterDoiAcquisitionEnabled({}), false);
    assert.equal(
      isNewsletterDoiAcquisitionEnabled({
        NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED: "false",
      }),
      false,
    );
    assert.equal(
      isNewsletterDoiAcquisitionEnabled({
        NEXT_PUBLIC_NEWSLETTER_DOI_ENABLED: "true",
      }),
      true,
    );
  });

  it("hero and form render brand, consent, and age controls", () => {
    const hero = renderToStaticMarkup(createElement(InlineNewsletterHero));
    assert.match(hero, /Jackpot Homie/);
    assert.match(hero, /Get the offers worth chasing/);
    assert.match(hero, /doi-newsletter-signup/);

    const form = renderToStaticMarkup(
      createElement(DoiNewsletterSignupForm, {
        signupSource: "newsletter_landing",
        enabled: true,
      }),
    );
    assert.match(form, /Email address/);
    assert.match(form, /newsletter/);
    assert.match(form, /21 years of age/);
    assert.match(form, /doi-website/);
  });
});

describe("S4-B security graph scans", () => {
  it("newsletter UI/client sources avoid service hostname and legacy subscribe", () => {
    const files = [
      readSrc("lib/newsletter/subscribe-client.ts"),
      readSrc("lib/newsletter/doi-constants.ts"),
      readSrc("lib/newsletter/newsletter-signup-controller.ts"),
      readSrc("components/newsletter/DoiNewsletterSignupForm.tsx"),
      readSrc("components/InlineNewsletterHero.tsx"),
      readSrc("app/page.tsx"),
    ].join("\n");

    // Strip line comments so documentation of exclusions does not trip the scan.
    const codeOnly = files
      .split("\n")
      .filter((line) => !/^\s*\/\//.test(line) && !/^\s*\*/.test(line))
      .join("\n");

    assert.equal(codeOnly.includes("jackpot-api-newsletter"), false);
    assert.equal(codeOnly.includes("email_signups"), false);
    assert.equal(codeOnly.includes("subscriber_email_hash"), false);
    assert.equal(codeOnly.includes("localStorage"), false);
    assert.equal(codeOnly.includes("dangerouslySetInnerHTML"), false);
    assert.match(codeOnly, /\/api\/newsletter\/subscribe/);
    assert.equal(codeOnly.includes('"/api/subscribe"'), false);
    assert.equal(codeOnly.includes("'/api/subscribe'"), false);
    assert.equal(codeOnly.includes("`/api/subscribe`"), false);
  });
});
