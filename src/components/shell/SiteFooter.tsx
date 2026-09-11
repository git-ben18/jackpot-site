import Link from 'next/link'
import React from 'react'

import {
  SHELL_BRAND_NAME,
  SHELL_FOOTER_LEGAL_LINKS,
} from '../../lib/shell/shell-allowlist'

/**
 * REIMPLEMENT — first-release footer from S5-A allowlist.
 * Not a copy of source Footer.tsx. Homepage-only DOI (no footer form).
 * No construction/staging visitor-facing copy.
 */
export default function SiteFooter() {
  return (
    <footer className="shell-footer">
      <div className="shell-inner shell-footer-row">
        <p className="muted">{SHELL_BRAND_NAME}</p>
        <nav aria-label="Legal">
          {SHELL_FOOTER_LEGAL_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
