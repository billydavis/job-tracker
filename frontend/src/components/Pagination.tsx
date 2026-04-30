interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

function getPageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages))
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: (number | '…')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}

const base = 'text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const inactive =
  `${base} border-gray-300/90 dark:border-white/10 bg-white/90 dark:bg-slate-800/60 ` +
  'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10'
const active =
  `${base} border-slate-800/10 dark:border-white/15 bg-slate-900/85 dark:bg-white/12 ` +
  'text-white dark:text-slate-100 cursor-default shadow-[0_8px_20px_-14px_rgba(15,23,42,0.8)]'

export default function Pagination({ page, totalPages, onPageChange, disabled }: PaginationProps) {
  const window = getPageWindow(page, totalPages)

  return (
    <div className="flex items-center gap-1.5">
      <button className={inactive} onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1}>
        Prev
      </button>

      {window.map((entry, i) =>
        entry === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400 dark:text-gray-500 select-none">
            …
          </span>
        ) : (
          <button
            key={entry}
            className={entry === page ? active : inactive}
            onClick={() => entry !== page && onPageChange(entry)}
            disabled={disabled && entry !== page}
          >
            {entry}
          </button>
        )
      )}

      <button className={inactive} onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages}>
        Next
      </button>
    </div>
  )
}
