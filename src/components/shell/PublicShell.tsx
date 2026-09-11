import React from 'react'

import ConsentMountSeam from './ConsentMountSeam'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

/**
 * First-release public shell frame (S5-A allowlist).
 * Kept free of CSS imports so unit tests can render it under node:test.
 */
export default function PublicShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <SiteHeader />
      <main className="shell-main">{children}</main>
      <SiteFooter />
      <ConsentMountSeam />
    </>
  )
}
