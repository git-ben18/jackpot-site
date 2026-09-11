import React from 'react'

import { SHELL_CONSENT_MOUNT_ID } from '../../lib/shell/shell-allowlist'

/**
 * Consent-control mount seam (S5-B/S5-D).
 *
 * First-release analytics sink is disabled-by-default (S5-A): no decorative
 * banner, no cookie write, no provider script. The fail-closed consent
 * controller lives in `src/lib/consent/*` for S5-F to consume.
 */
export default function ConsentMountSeam() {
  return (
    <div
      id={SHELL_CONSENT_MOUNT_ID}
      data-consent-mount=""
      data-consent-ui="none"
      hidden
    />
  )
}
