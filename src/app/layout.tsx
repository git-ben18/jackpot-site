import type { Metadata } from 'next'

import PublicShell from '../components/shell/PublicShell'
import { SHELL_METADATA } from '../lib/shell/shell-allowlist'
import './globals.css'

/**
 * REIMPLEMENT — first-release root shell from the S5-A allowlist.
 * Not a copy of rewards-maxxing-frontend layout.tsx.
 * Keeps session/explore/cookie/tracker globals and acquisition fallbacks out.
 */

export const metadata: Metadata = {
  title: SHELL_METADATA.title,
  description: SHELL_METADATA.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  )
}
