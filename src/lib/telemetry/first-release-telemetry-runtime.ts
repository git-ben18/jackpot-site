/**
 * Default first-release telemetry runtime.
 * Production: consent unknown + sink disabled_by_default + explicit noop transport.
 * Tests may replace via setFirstReleaseTelemetryForTests.
 */
import { createAnalyticsConsentController } from '../consent/analytics-consent-controller'
import {
  createFirstReleaseTelemetrySeam,
  type FirstReleaseTelemetrySeam,
} from './first-release-telemetry-seam'
import { createNoopTelemetryTransport } from './first-release-telemetry-transport'

function createDefaultSeam(): FirstReleaseTelemetrySeam {
  return createFirstReleaseTelemetrySeam({
    consent: createAnalyticsConsentController(),
    transport: createNoopTelemetryTransport(),
  })
}

let runtimeSeam: FirstReleaseTelemetrySeam = createDefaultSeam()

export function getFirstReleaseTelemetry(): FirstReleaseTelemetrySeam {
  return runtimeSeam
}

/** Test/harness only — restores default when called with null. */
export function setFirstReleaseTelemetryForTests(
  seam: FirstReleaseTelemetrySeam | null,
): void {
  runtimeSeam = seam ?? createDefaultSeam()
}
