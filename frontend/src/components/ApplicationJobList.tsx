import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, X } from 'lucide-react'
import type { Company, Job, JobStatus } from '../types'
import NotesPanel from './NotesPanel'
import ListPaginationBar from './ListPaginationBar'
import { ALL_STATUSES, STATUS_STYLES, formatAppliedDate } from '../lib/jobApplicationUi'
import { formatJobSalary } from '../lib/formatJobSalary'

export interface ApplicationJobListProps {
  jobs: Job[]
  companies: Company[]
  loading: boolean
  error?: { message?: string; error?: string } | null
  isFetching: boolean
  emptyMessage: string
  emptyHint?: ReactNode
  showEmptyHint?: boolean
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  /** Persisted list page size (Applications only). Omit on company detail (fixed limit). */
  onLimitChange?: (limit: number) => void
  onStatusChange: (job: Job, status: JobStatus) => void
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  deletePending: boolean
  /** When set, company line shows this text only (e.g. on company detail). Otherwise link to company from job. */
  companySubtitle?: string
}

export default function ApplicationJobList({
  jobs,
  companies,
  loading,
  error,
  isFetching,
  emptyMessage,
  emptyHint,
  showEmptyHint,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  onStatusChange,
  onEdit,
  onDelete,
  deletePending,
  companySubtitle,
}: ApplicationJobListProps) {
  const companyName = (companyId?: string) =>
    companies.find((c) => c._id === companyId)?.name ?? companyId ?? '—'

  const errObj = error ?? null
  const errorMessage = errObj?.error ?? errObj?.message ?? 'Failed to load applications'

  return (
    <>
      {loading && <div className="text-gray-400 dark:text-gray-500">Loading…</div>}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4">
          {errorMessage}
        </div>
      )}

      {!loading && !error && (
        <div className={isFetching ? 'opacity-60 pointer-events-none' : ''}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                {showEmptyHint && emptyHint}
              </div>
            ) : (
              jobs.map((j) => {
                const salaryLabel = formatJobSalary(j)
                return (
                <div
                  key={j._id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/jobs/${j._id}`}
                          className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {j.title}
                        </Link>
                        {j.location && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">
                            {j.location}
                          </span>
                        )}
                        {salaryLabel != null && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {salaryLabel}
                          </span>
                        )}
                      </div>
                      {companySubtitle != null ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {companySubtitle}
                        </p>
                      ) : j.companyId ? (
                        <Link
                          to={`/companies/${j.companyId}`}
                          className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {companyName(j.companyId)}
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {companyName(j.companyId)}
                        </p>
                      )}
                      {j._id && <NotesPanel jobId={j._id} />}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <select
                          value={j.status}
                          onChange={(e) => onStatusChange(j, e.target.value as JobStatus)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_STYLES[j.status]}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onEdit(j)}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-1"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(j._id!)}
                          disabled={deletePending}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1 disabled:opacity-50"
                          title="Delete"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Applied {formatAppliedDate(j.dateApplied)}
                      </p>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
          <ListPaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            disabled={isFetching}
          />
        </div>
      )}
    </>
  )
}
