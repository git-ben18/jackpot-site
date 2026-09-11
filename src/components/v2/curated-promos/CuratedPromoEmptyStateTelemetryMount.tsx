'use client'

/**
 * Client-only once-mount for empty-state telemetry from server-rendered landing.
 * Fail-soft: emit failures never affect EmptyState UX.
 */
import { useEffect, useRef } from 'react'

import { getFirstReleaseTelemetry } from '../../../lib/telemetry/first-release-telemetry-runtime'
import type { FirstReleaseTelemetrySeam } from '../../../lib/telemetry/first-release-telemetry-seam'
import type { TelemetryEmptyStateReason } from '../../../lib/telemetry/first-release-telemetry-contract'

export type CuratedPromoEmptyStateTelemetryMountProps = {
  reason: TelemetryEmptyStateReason
  telemetry?: FirstReleaseTelemetrySeam
}

export default function CuratedPromoEmptyStateTelemetryMount({
  reason,
  telemetry: telemetryProp,
}: CuratedPromoEmptyStateTelemetryMountProps) {
  const telemetry = telemetryProp ?? getFirstReleaseTelemetry()
  const emitted = useRef(false)

  useEffect(() => {
    if (emitted.current) return
    emitted.current = true
    telemetry.emitApprovedEvent('curated_promo_empty_state_view', { reason })
  }, [reason, telemetry])

  return null
}
