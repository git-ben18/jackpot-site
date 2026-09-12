/**
 * S5-F storage-independent transports.
 * Production default is an explicit disabled sink — not a missing provider.
 * No GTM, no Supabase telemetry schema, no DB-W4 objects.
 */
import type { FirstReleaseTelemetryEnvelope } from './first-release-telemetry-contract'

export const FIRST_RELEASE_TELEMETRY_TRANSPORT_KINDS = [
  'disabled',
  'noop',
  'fake',
] as const

export type FirstReleaseTelemetryTransportKind =
  (typeof FIRST_RELEASE_TELEMETRY_TRANSPORT_KINDS)[number]

export type FirstReleaseTelemetryTransport = {
  kind: FirstReleaseTelemetryTransportKind
  send: (envelope: FirstReleaseTelemetryEnvelope) => void | Promise<void>
}

export type FakeTelemetryTransport = FirstReleaseTelemetryTransport & {
  kind: 'fake'
  sent: FirstReleaseTelemetryEnvelope[]
  sendCount: number
}

export function isFirstReleaseTelemetryTransportKind(
  value: string,
): value is FirstReleaseTelemetryTransportKind {
  return (FIRST_RELEASE_TELEMETRY_TRANSPORT_KINDS as readonly string[]).includes(
    value,
  )
}

/** Production / default sink. Must never be treated as a misconfigured provider. */
export function createDisabledTelemetryTransport(): FirstReleaseTelemetryTransport {
  return {
    kind: 'disabled',
    send() {
      // Explicit disabled sink: drop without throwing or buffering.
    },
  }
}

/** Local acceptance no-op that is labeled, not silently missing. */
export function createNoopTelemetryTransport(): FirstReleaseTelemetryTransport {
  return {
    kind: 'noop',
    send() {
      // Explicit no-op sink.
    },
  }
}

export type CreateFakeTelemetryTransportOptions = {
  /** Sync throw from send() to prove product paths stay fail-soft. */
  throwOnSend?: boolean | Error
  /** Rejected promise from send() (async failure). */
  rejectOnSend?: boolean | Error
  /** Never-resolving send() to model timeout. */
  hangOnSend?: boolean
}

export function createFakeTelemetryTransport(
  options: CreateFakeTelemetryTransportOptions = {},
): FakeTelemetryTransport {
  const sent: FirstReleaseTelemetryEnvelope[] = []
  const transport: FakeTelemetryTransport = {
    kind: 'fake',
    sent,
    sendCount: 0,
    send(envelope) {
      transport.sendCount += 1
      if (options.throwOnSend) {
        throw options.throwOnSend === true
          ? new Error('fake_transport_throw')
          : options.throwOnSend
      }
      if (options.hangOnSend) {
        return new Promise<void>(() => {
          // Intentionally never resolves.
        })
      }
      if (options.rejectOnSend) {
        const error =
          options.rejectOnSend === true
            ? new Error('fake_transport_reject')
            : options.rejectOnSend
        return Promise.reject(error)
      }
      sent.push(envelope)
    },
  }
  return transport
}
