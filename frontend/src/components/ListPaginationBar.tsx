import Pagination from './Pagination'
import { LIST_PAGE_SIZE_OPTIONS } from '../lib/listPageSize'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const muted = 'text-sm text-gray-500 dark:text-slate-400 min-w-0'

export interface ListPaginationBarProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  /** When set, shows per-page selector (Applications / Companies lists). */
  onLimitChange?: (limit: number) => void
  disabled?: boolean
}

export default function ListPaginationBar({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  disabled,
}: ListPaginationBarProps) {
  const showBar = total > 0 && (totalPages > 1 || onLimitChange != null)
  if (!showBar) return null

  const showingText = (
    <p className={`${muted} tabular-nums`}>
      Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
    </p>
  )

  const pageControls =
    totalPages > 1 ? (
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={disabled}
      />
    ) : null

  const perPage =
    onLimitChange != null ? (
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 shrink-0">
        <span className="whitespace-nowrap">Per page</span>
        <Select
          value={String(limit)}
          onValueChange={(value) => onLimitChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger size="sm" className="w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {LIST_PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    ) : null

  return (
    <div className="w-full">
      <div className="rounded-b-2xl rounded-t-none border border-white/70 dark:border-white/10 border-t border-t-gray-200/70 dark:border-t-white/10 bg-white/70 dark:bg-slate-900/55 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="hidden w-full grid-cols-[1fr_auto_1fr] items-center gap-x-4 sm:grid">
          <div className="flex min-w-0 justify-start">{showingText}</div>
          <div className="flex items-center justify-center gap-3">
            {pageControls}
            {totalPages > 1 ? (
              <span className="text-xs text-gray-500 dark:text-slate-400 tabular-nums">
                Page {page} of {totalPages}
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 justify-end">{perPage}</div>
        </div>

        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <p className={`${muted} tabular-nums text-xs`}>
              {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>
            {totalPages > 1 ? (
              <span className="text-xs text-gray-500 dark:text-slate-400 tabular-nums">
                {page}/{totalPages}
              </span>
            ) : null}
          </div>
          <div className="flex w-full justify-center">
            {pageControls ?? perPage}
          </div>
          {pageControls && perPage ? (
            <div className="flex w-full justify-center">{perPage}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
