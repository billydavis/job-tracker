import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, X } from 'lucide-react'
import type { Company, Job, JobStatus } from '../types'
import NotesPanel from './NotesPanel'
import ListPaginationBar from './ListPaginationBar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import {
  ALL_STATUSES,
  STATUS_STYLES,
  formatAppliedDate,
  locationListBadgeClassName,
} from '../lib/jobApplicationUi'
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
  /** When true, render as attached to an external filter bar surface. */
  attachedToFilters?: boolean
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
  attachedToFilters = false,
}: ApplicationJobListProps) {
  const navigate = useNavigate()
  const companyName = (companyId?: string) =>
    companies.find((c) => c._id === companyId)?.name ?? companyId ?? '—'
  const showFooter = total > 0 && (totalPages > 1 || onLimitChange != null)

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
          <div
            className={`bg-white/70 dark:bg-slate-900/55 backdrop-blur-md shadow-sm border border-white/70 dark:border-white/10 divide-y divide-gray-200/70 dark:divide-white/10 ${
              attachedToFilters
                ? showFooter
                  ? 'rounded-none border-t-0 border-b-0'
                  : 'rounded-b-2xl rounded-t-none border-t-0'
                : showFooter
                  ? 'rounded-t-2xl rounded-b-none border-b-0'
                  : 'rounded-2xl'
            }`}
          >
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
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    if (j._id) navigate(`/jobs/${j._id}`)
                  }}
                  onKeyDown={(e) => {
                    if (!j._id) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/jobs/${j._id}`)
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/jobs/${j._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                        >
                          {j.title}
                        </Link>
                        {j.location && (
                          <span className={locationListBadgeClassName(j.location)}>
                            {j.location}
                          </span>
                        )}
                        {salaryLabel != null && (
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
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
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                        >
                          {companyName(j.companyId)}
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {companyName(j.companyId)}
                        </p>
                      )}
                      {j._id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <NotesPanel jobId={j._id} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <Select
                          value={j.status}
                          onValueChange={(value) => onStatusChange(j, value as JobStatus)}
                        >
                          <SelectTrigger
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className={`w-[116px] rounded-full text-xs font-medium ${STATUS_STYLES[j.status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            {ALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(j)
                          }}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-1"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(j._id!)
                          }}
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
