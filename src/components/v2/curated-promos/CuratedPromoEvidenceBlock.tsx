import React from 'react'
import type { CuratedPromoEvidenceDTO } from '../../../types/curatedPromos'

type CuratedPromoEvidenceBlockProps = {
  evidence: CuratedPromoEvidenceDTO[]
}

export default function CuratedPromoEvidenceBlock({ evidence }: CuratedPromoEvidenceBlockProps) {
  if (!evidence.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source evidence</p>
      <ul className="space-y-2">
        {evidence.map((item, index) => (
          <li
            key={`${item.sourceField ?? 'evidence'}-${index}`}
            className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <p>{item.text}</p>
            {item.assetRef && (
              <p className="mt-1 text-xs text-slate-500">Asset: {item.assetRef}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
