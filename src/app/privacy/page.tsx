import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Jackpot Homie",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy</h1>
      <p className="muted">
        Placeholder privacy route for the approved initial public surface.
        Production policy values are not invented here; they close under ACQ-05
        / JSE-S5.
      </p>
    </>
  );
}
