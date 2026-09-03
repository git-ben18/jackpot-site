import React from 'react'

type CuratedPromoEmptyStateProps = {
  message?: string
  onClearFilters?: () => void
}

export default function CuratedPromoEmptyState({
  message = 'No promos match your filters.',
  onClearFilters,
}: CuratedPromoEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 text-sm font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
