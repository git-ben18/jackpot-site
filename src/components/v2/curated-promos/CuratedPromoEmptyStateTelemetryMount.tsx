'use client'

/**
 * Client mount seam for S5-E events that fire from server-rendered empty states
 * (fail_soft on CuratedPromoLandingSectionView). Renders nothing.
 *
 * Attempt/dedupe is owned by this mount instance (page/widget lifetime).
 */
import { useEffect, useRef } from 'react'

import {
  emitApprovedEventFailSoft,
  getDefaultFirstReleaseTelemetry,
  type FirstReleaseTelemetryEmitter,
} from '../../../lib/telemetry/first-release-telemetry-emitter'
import { createOnceAttemptTracker } from '../../../lib/telemetry/first-release-telemetry-triggers'
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
  const onceAttemptsRef = useRef(
    createOnceAttemptTracker<TelemetryEmptyStateReason>(),
  )

  useEffect(() => {
    if (!onceAttemptsRef.current.attempt(reason)) return
    emitApprovedEventFailSoft(emitter, 'curated_promo_empty_state_view', {
      reason,
    })
  }, [emitter, reason])

  return null
}
