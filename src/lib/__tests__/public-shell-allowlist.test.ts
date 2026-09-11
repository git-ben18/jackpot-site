/**
 * S5-B public shell allowlist tests.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import ConsentMountSeam from '../../components/shell/ConsentMountSeam'
import PublicShell from '../../components/shell/PublicShell'
import SiteFooter from '../../components/shell/SiteFooter'
import SiteHeader from '../../components/shell/SiteHeader'
import {
  SHELL_BRAND_NAME,
  SHELL_CONSENT_MOUNT_ID,
  SHELL_FORBIDDEN_NAV_HREFS,
  SHELL_FOOTER_DOI,
  SHELL_FOOTER_LEGAL_LINKS,
  SHELL_METADATA,
  SHELL_PRIMARY_NAV,
} from '../shell/shell-allowlist'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const srcRoot = join(rootDir, 'src')

const SHELL_RUNTIME_FILES = [
  'src/app/layout.tsx',
  'src/components/shell/PublicShell.tsx',
  'src/components/shell/SiteHeader.tsx',
  'src/components/shell/SiteFooter.tsx',
  'src/components/shell/ConsentMountSeam.tsx',
  'src/lib/shell/shell-allowlist.ts',
] as const

const FORBIDDEN_SHELL_IMPORT_PATTERNS = [
  /SessionInit/,
  /ExploreFAB/,
  /ExploreDrawer/,
  /CookieBanner/,
  /useTracker/,
  /LandingDashboardClient/,
  /HottestOffers/,
  /AcquisitionSignup/,
  /EmailSignupForm/,
  /newsletter-service-client/,
  /newsletter-service-auth/,
  /newsletter-bff/,
  /curatedPromoRepository/,
  /getSupabaseAdminClient/,
  /SUPABASE_SERVICE_ROLE/,
  /googletagmanager|GTM-|gtag\(/i,
  /jackpot-api-newsletter/,
]

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue
      walkFiles(full, out)
      continue
    }
    if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(full)
  }
  return out
}

function hrefsFromMarkup(html: string): string[] {
  const found: string[] = []
  const re = /href="([^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    found.push(match[1])
  }
  return found
}

describe('S5-B shell allowlist constants', () => {
  it('freezes primary nav and footer legal links to approved routes', () => {
    assert.deepEqual(
      SHELL_PRIMARY_NAV.map((item) => item.href),
      ['/', '/privacy'],
    )
    assert.deepEqual(
      SHELL_FOOTER_LEGAL_LINKS.map((item) => item.href),
      ['/privacy'],
    )
    assert.equal(SHELL_FOOTER_DOI, 'homepage-only')
    assert.equal(SHELL_METADATA.title, SHELL_BRAND_NAME)
    assert.doesNotMatch(SHELL_METADATA.description, /construction|staging/i)
  })
})

describe('S5-B SiteHeader / SiteFooter presentation', () => {
  it('renders brand and Privacy; omits forbidden and flow-only nav', () => {
    const header = renderToStaticMarkup(createElement(SiteHeader))
    const footer = renderToStaticMarkup(createElement(SiteFooter))
    const headerHrefs = hrefsFromMarkup(header)
    const footerHrefs = hrefsFromMarkup(footer)

    assert.match(header, new RegExp(SHELL_BRAND_NAME))
    assert.match(header, /aria-label="Primary"/)
    assert.ok(headerHrefs.includes('/'))
    assert.ok(headerHrefs.includes('/privacy'))
    assert.ok(footerHrefs.includes('/privacy'))
    assert.match(footer, /aria-label="Legal"/)
    assert.doesNotMatch(footer, /construction|staging/i)
    assert.doesNotMatch(footer, /DOI|Subscribe|newsletter signup/i)

    for (const href of [...headerHrefs, ...footerHrefs]) {
      assert.equal(
        SHELL_FORBIDDEN_NAV_HREFS.includes(
          href as (typeof SHELL_FORBIDDEN_NAV_HREFS)[number],
        ),
        false,
        `forbidden shell href present: ${href}`,
      )
    }
  })

  it('exposes an empty consent mount seam without banner copy', () => {
    const html = renderToStaticMarkup(createElement(ConsentMountSeam))
    assert.match(html, new RegExp(`id="${SHELL_CONSENT_MOUNT_ID}"`))
    assert.match(html, /data-consent-mount=""/)
    assert.doesNotMatch(html, /cookie|analytics|accept|reject/i)
  })
})

describe('S5-B RootLayout composition', () => {
  it('wraps children in main and keeps Privacy reachable from the shell', () => {
    const html = renderToStaticMarkup(
      createElement(
        PublicShell,
        null,
        createElement('p', null, 'child-page-slot'),
      ),
    )
    assert.match(html, /<main class="shell-main">/)
    assert.match(html, /child-page-slot/)
    assert.match(html, new RegExp(SHELL_BRAND_NAME))
    assert.match(html, /href="\/privacy"/)
    assert.match(html, new RegExp(`id="${SHELL_CONSENT_MOUNT_ID}"`))
    assert.doesNotMatch(html, /construction|staging/i)
    assert.doesNotMatch(html, /SessionInit|ExploreFAB|CookieBanner|useTracker/)
  })

  it('keeps layout metadata product-facing without construction claims', () => {
    const layoutSource = readFileSync(join(rootDir, 'src/app/layout.tsx'), 'utf8')
    assert.match(layoutSource, /lang="en"/)
    assert.match(layoutSource, /PublicShell/)
    assert.match(layoutSource, /SHELL_METADATA/)
    assert.doesNotMatch(layoutSource, /Construction and staging only/)
  })

  it('removes visitor-facing Hosted Acceptance diagnostic from the homepage', () => {
    const page = readFileSync(join(rootDir, 'src/app/page.tsx'), 'utf8')
    assert.match(page, /InlineNewsletterHero/)
    assert.match(page, /CuratedPromoLandingSection/)
    assert.doesNotMatch(page, /Hosted Acceptance/)
    assert.doesNotMatch(page, /local DOI signup UI/)
  })
})

describe('S5-B shell import and side-effect guardrails', () => {
  it('keeps excluded globals and service transports out of shell runtime files', () => {
    for (const rel of SHELL_RUNTIME_FILES) {
      const source = readFileSync(join(rootDir, rel), 'utf8')
      assert.doesNotMatch(source, /\bfetch\s*\(|sendBeacon|localStorage|sessionStorage/)
      const importLines = source
        .split(/\r?\n/)
        .filter((line) => /^\s*import\b/.test(line))
        .join('\n')
      for (const pattern of FORBIDDEN_SHELL_IMPORT_PATTERNS) {
        assert.doesNotMatch(
          importLines,
          pattern,
          `${rel} import matched forbidden pattern ${pattern}`,
        )
      }
    }
  })

  it('does not introduce middleware or excluded shell modules under src/', () => {
    const files = walkFiles(srcRoot).map((f) => relative(srcRoot, f).replace(/\\/g, '/'))
    assert.equal(files.includes('middleware.ts'), false)
    for (const name of [
      'SessionInit',
      'ExploreFAB',
      'CookieBanner',
      'LandingDashboardClient',
      'AcquisitionSignup',
      'EmailSignupForm',
    ]) {
      assert.equal(
        files.some((f) => f.includes(name)),
        false,
        `excluded module path present: ${name}`,
      )
    }
  })
})
