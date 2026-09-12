'use client'

/**
 * Client mount seam for S5-E events that fire from server-rendered empty states
 * (fail_soft on CuratedPromoLandingSectionView). Renders nothing.
 */
import { useEffect } from 'react'

import {
  emitApprovedEventFailSoft,
  getDefaultFirstReleaseTelemetry,
  type FirstReleaseTelemetryEmitter,
} from '../../../lib/telemetry/first-release-telemetry-emitter'
import { emptyStateOnceKey } from '../../../lib/telemetry/first-release-telemetry-triggers'
import type { TelemetryEmptyStateReason } from '../../../lib/telemetry/first-release-telemetry-contract'

export type CuratedPromoEmptyStateTelemetryMountProps = {
  reason: TelemetryEmptyStateReason
  telemetry?: FirstReleaseTelemetryEmitter
}

export default function CuratedPromoEmptyStateTelemetryMount({
  reason,
  telemetry,
}: CuratedPromoEmptyStateTelemetryMountProps) {
  const emitter = telemetry ?? getDefaultFirstReleaseTelemetry()

  useEffect(() => {
    emitApprovedEventFailSoft(
      emitter,
      'curated_promo_empty_state_view',
      { reason },
      { onceKey: emptyStateOnceKey(reason) },
    )
  }, [emitter, reason])

  return null
}
