import React from 'react'

import { SHELL_CONSENT_MOUNT_ID } from '../../lib/shell/shell-allowlist'

/**
 * Empty consent-control mount seam for S5-D.
 * No banner, cookie write, or analytics side effect in S5-B.
 */
export default function ConsentMountSeam() {
  return (
    <div
      id={SHELL_CONSENT_MOUNT_ID}
      data-consent-mount=""
      hidden
    />
  )
}
