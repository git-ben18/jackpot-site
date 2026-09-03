import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jackpot Homie",
  description: "Public Jackpot Homie site. Construction and staging only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="shell-header">
          <div className="shell-inner shell-nav">
            <Link className="shell-brand" href="/">
              Jackpot Homie
            </Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </header>
        <main className="shell-main">{children}</main>
        <footer className="shell-footer">
          <div className="shell-inner">
            <p className="muted">
              Construction/staging target. Not the production public site or
              newsletter BFF.
            </p>
            <Link href="/privacy">Privacy</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
