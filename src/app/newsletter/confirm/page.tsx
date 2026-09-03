import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm subscription | Jackpot Homie",
};

export default function NewsletterConfirmPage() {
  return (
    <>
      <h1>Confirm subscription</h1>
      <p className="muted">
        Placeholder confirmation route. This page does not read confirmation
        tokens or call the newsletter service. Same-origin BFF routes are
        JSE-S4.
      </p>
    </>
  );
}
