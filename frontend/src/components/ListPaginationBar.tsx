import Pagination from './Pagination'
import { LIST_PAGE_SIZE_OPTIONS } from '../lib/listPageSize'

const selectCls =
  'text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500'

const muted = 'text-sm text-gray-400 dark:text-gray-500 min-w-0'

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
    <p className={muted}>
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
      <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 shrink-0">
        <span className="whitespace-nowrap">Per page</span>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value))
          }}
          disabled={disabled}
          className={selectCls}
        >
          {LIST_PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    ) : null

  return (
    <div className="mt-4 w-full">
      <div className="hidden w-full grid-cols-[1fr_auto_1fr] items-center gap-x-4 sm:grid">
        <div className="flex min-w-0 justify-start">{showingText}</div>
        <div className="flex justify-center">{pageControls}</div>
        <div className="flex min-w-0 justify-end">{perPage}</div>
      </div>
      <div className="flex w-full justify-center sm:hidden">
        {pageControls ?? perPage}
      </div>
    </div>
  )
}
