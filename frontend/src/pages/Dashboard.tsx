import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, X } from 'lucide-react'
import type { Job, JobFilters, JobStatus } from '../types'
import { useJobsQuery, useCreateJobMutation, useUpdateJobMutation, useDeleteJobMutation } from '../hooks/useJobs'
import { useCompaniesQuery } from '../hooks/useCompanies'
import JobModal, { type JobFormData } from '../components/JobModal'
import NotesPanel from '../components/NotesPanel'
import Pagination from '../components/Pagination'
import { DEFAULT_PAGE_SIZE } from '../api/client'

const ALL_STATUSES: JobStatus[] = ['waiting','applied','interview','offer','negotiation','rejected','ghosted']

const STATUS_STYLES: Record<JobStatus, string> = {
  waiting: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  interview: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  negotiation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  ghosted: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

function formatAppliedDate(dateApplied?: string) {
  if (!dateApplied) return 'Date applied not set'
  const timestamp = Date.parse(dateApplied)
  if (Number.isNaN(timestamp)) return 'Date applied not set'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp))
}

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<JobStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filterStatus])

  const filters: JobFilters = { page, limit, search, status: filterStatus }
  const { data, isLoading: loading, isFetching, error } = useJobsQuery(filters)
  const jobs       = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const { data: companies = [] } = useCompaniesQuery()
  const createJobMutation = useCreateJobMutation()
  const updateJobMutation = useUpdateJobMutation()
  const deleteJobMutation = useDeleteJobMutation()

  async function handleModalSubmit(form: JobFormData) {
    const payload: Partial<Job> = {
      title: form.title,
      companyId: form.companyId || undefined,
      status: form.status,
      location: form.location || undefined,
      salary: form.salary ? Number(form.salary) : undefined,
      url: form.url || undefined,
      dateApplied: form.dateApplied || undefined,
      description: form.description || undefined,
      contact: form.contact || undefined,
    }
    if (editingJob?._id) {
      await updateJobMutation.mutateAsync({ id: editingJob._id, payload })
    } else {
      await createJobMutation.mutateAsync(payload)
    }
  }

  function openCreate() { setEditingJob(undefined); setModalOpen(true) }
  function openEdit(j: Job) { setEditingJob(j); setModalOpen(true) }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return
    await deleteJobMutation.mutateAsync(id)
  }

  async function handleStatusChange(j: Job, status: JobStatus) {
    if (!j._id) return
    await updateJobMutation.mutateAsync({ id: j._id, payload: { status } })
  }

  const errObj = error as { error?: string; message?: string } | null
  const errorMessage = errObj?.error ?? errObj?.message ?? 'Failed to load jobs'

  const companyName = (companyId?: string) =>
    companies.find(c => c._id === companyId)?.name ?? companyId ?? '—'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h1>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Add job
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title…"
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-52"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as JobStatus | '')}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={limit}
          onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
        </select>
        {(filterStatus || search) && (
          <button
            onClick={() => { setFilterStatus(''); setSearch('') }}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

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
              <p className="font-medium text-gray-500 dark:text-gray-400">
                {total === 0 && !search && !filterStatus ? 'No applications yet' : 'No jobs match your filters'}
              </p>
              {total === 0 && !search && !filterStatus && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Click <strong>+ Add job</strong> to get started.
                </p>
              )}
            </div>
          ) : jobs.map(j => (
            <div key={j._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                {/* Left: title + company */}
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
                    {j.salary && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ${j.salary.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {j.companyId ? (
                    <Link
                      to={`/companies/${j.companyId}`}
                      className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {companyName(j.companyId)}
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{companyName(j.companyId)}</p>
                  )}
                  {j._id && <NotesPanel jobId={j._id} />}
                </div>

                {/* Right: status dropdown + actions */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <select
                      value={j.status}
                      onChange={e => handleStatusChange(j, e.target.value as JobStatus)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_STYLES[j.status]}`}
                    >
                      {ALL_STATUSES.map(s => (
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
                      onClick={() => openEdit(j)}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-1"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(j._id!)}
                      disabled={deleteJobMutation.isPending}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1 disabled:opacity-50"
                      title="Delete"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Applied {formatAppliedDate(j.dateApplied)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isFetching} />
          </div>
        )}
        </div>
      )}

      {modalOpen && (
        <JobModal
          job={editingJob}
          companies={companies}
          onSubmit={handleModalSubmit}
          onClose={() => { setModalOpen(false); setEditingJob(undefined) }}
        />
      )}
    </div>
  )
}
