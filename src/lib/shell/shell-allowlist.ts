/**
 * S5-A / S5-B first-release public shell allowlist.
 * Navigation and legal links must stay within this set.
 * Flow-only routes must not appear in header/footer nav.
 */
export const SHELL_BRAND_NAME = 'Jackpot Homie' as const

export const SHELL_PRIMARY_NAV = [
  { href: '/', label: 'Home', kind: 'brand' },
  { href: '/privacy', label: 'Privacy', kind: 'nav' },
] as const

export const SHELL_FOOTER_LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
] as const

/** Flow-only routes — reachable by product flow, never primary shell nav. */
export const SHELL_FLOW_ONLY_ROUTES = ['/newsletter/confirm'] as const

export const SHELL_FORBIDDEN_NAV_HREFS = [
  '/discover-offers',
  '/dashboard',
  '/blog',
  '/terms',
  '/newsletter',
  '/newsletter/confirm',
] as const

/** Empty mount id reserved for S5-D consent controls. */
export const SHELL_CONSENT_MOUNT_ID = 'site-consent-root' as const

export const SHELL_METADATA = {
  title: SHELL_BRAND_NAME,
  description:
    'Jackpot Homie — curated casino promotion and event information by email.',
} as const

/** Footer DOI placement frozen in S5-A (D-S5-03). */
export const SHELL_FOOTER_DOI = 'homepage-only' as const
