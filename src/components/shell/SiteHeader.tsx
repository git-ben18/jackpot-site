import Link from 'next/link'
import React from 'react'

import {
  SHELL_BRAND_NAME,
  SHELL_PRIMARY_NAV,
} from '../../lib/shell/shell-allowlist'

/**
 * REIMPLEMENT — first-release header from S5-A allowlist.
 * Not a copy of source Navbar.tsx. No confirmation/flow-only links.
 */
export default function SiteHeader() {
  return (
    <header className="shell-header">
      <div className="shell-inner shell-nav">
        {SHELL_PRIMARY_NAV.map((item) =>
          item.kind === 'brand' ? (
            <Link
              key={item.href}
              className="shell-brand"
              href={item.href}
            >
              {SHELL_BRAND_NAME}
            </Link>
          ) : (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ),
        )}
      </div>
    </header>
  )
}
