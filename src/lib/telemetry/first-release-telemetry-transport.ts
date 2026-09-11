/**
 * S5-F storage-independent telemetry transports.
 * Fake/no-op and recording are explicit; no provider/DB policy invented here.
 */

import {
  TELEMETRY_SCHEMA_VERSION,
  type FirstReleaseTelemetryEventName,
  type FirstReleaseTelemetryPayloadByEvent,
} from './first-release-telemetry-contract'

export type FirstReleaseTelemetryEnvelope<
  N extends FirstReleaseTelemetryEventName = FirstReleaseTelemetryEventName,
> = {
  name: N
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION
  payload: FirstReleaseTelemetryPayloadByEvent[N]
}

export type TelemetryTransportKind = 'noop' | 'recording' | 'throwing'

export type FirstReleaseTelemetryTransport = {
  readonly kind: TelemetryTransportKind
  send: (envelope: FirstReleaseTelemetryEnvelope) => void | Promise<void>
}

/** Explicit no-op — production default companion to disabled_by_default sink. */
export function createNoopTelemetryTransport(): FirstReleaseTelemetryTransport {
  return {
    kind: 'noop',
    send() {
      /* intentional no-op */
    },
  }
}

/** In-memory recording transport for local S5-F acceptance tests. */
export function createRecordingTelemetryTransport(): FirstReleaseTelemetryTransport & {
  getSent: () => FirstReleaseTelemetryEnvelope[]
  clear: () => void
} {
  const sent: FirstReleaseTelemetryEnvelope[] = []
  return {
    kind: 'recording',
    send(envelope) {
      sent.push(envelope)
    },
    getSent: () => [...sent],
    clear() {
      sent.length = 0
    },
  }
}

/** Test-only transport that throws (sync) to prove fail-soft product UX. */
export function createThrowingTelemetryTransport(
  message = 'telemetry_transport_test_failure',
): FirstReleaseTelemetryTransport {
  return {
    kind: 'throwing',
    send() {
      throw new Error(message)
    },
  }
}
