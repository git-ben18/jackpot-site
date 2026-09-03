import React from 'react'
import type { CuratedPromoSignalDTO } from '../../../types/curatedPromos'
import {
  getSignalSheetLabel,
  groupSignalsForDetailSheet,
} from '../../../lib/constants/curatedPromoSignalCategory'
import { signalDisplayValue } from '../../../lib/curated-promo-display'

type CuratedPromoSignalListProps = {
  signals: CuratedPromoSignalDTO[]
}

export default function CuratedPromoSignalList({ signals }: CuratedPromoSignalListProps) {
  if (!signals.length) {
    return <p className="text-sm text-slate-500">No signals parsed for this promo yet.</p>
  }

  const grouped = groupSignalsForDetailSheet(signals)

  return (
    <div className="space-y-4">
      {grouped.map(({ category, label, signals: categorySignals }) => (
        <div key={category}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <ul className="mt-2 space-y-2">
            {categorySignals.map((signal) => (
              <li
                key={signal.signalId || `${category}-${signal.extractionKey}-${signal.valueRaw}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-900">{getSignalSheetLabel(signal)}</p>
                <p className="text-sm text-slate-700">{signalDisplayValue(signal)}</p>
                {signal.evidenceText && (
                  <p className="mt-1 text-xs text-slate-500">{signal.evidenceText}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
