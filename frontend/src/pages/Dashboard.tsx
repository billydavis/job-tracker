import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { User, Job, JobStatus } from '../types'
import { useJobsQuery, useCreateJobMutation, useUpdateJobMutation, useDeleteJobMutation } from '../hooks/useJobs'
import { useLogoutMutation } from '../hooks/useAuth'
import { useCompaniesQuery } from '../hooks/useCompanies'
import JobModal, { type JobFormData } from '../components/JobModal'
import NotesPanel from '../components/NotesPanel'

const STATUS_STYLES: Record<JobStatus, string> = {
  waiting:     'bg-gray-100     text-gray-600  dark:bg-gray-700        dark:text-gray-300',
  applied:     'bg-blue-100     text-blue-700  dark:bg-blue-900/30     dark:text-blue-400',
  interview:   'bg-violet-100   text-violet-700 dark:bg-violet-900/30  dark:text-violet-400',
  offer:       'bg-green-100    text-green-700 dark:bg-green-900/30    dark:text-green-400',
  negotiation: 'bg-amber-100    text-amber-700 dark:bg-amber-900/30    dark:text-amber-400',
  rejected:    'bg-red-100      text-red-600   dark:bg-red-900/30      dark:text-red-400',
  ghosted:     'bg-zinc-100     text-zinc-500  dark:bg-zinc-800        dark:text-zinc-400',
}

const ALL_STATUSES: JobStatus[] = ['waiting','applied','interview','offer','negotiation','rejected','ghosted']

interface Props { user: User }

function getDateAppliedTimestamp(job: Job) {
  if (!job.dateApplied) return Number.NEGATIVE_INFINITY
  const timestamp = Date.parse(job.dateApplied)
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

function formatAppliedDate(dateApplied?: string) {
  if (!dateApplied) return 'Date applied not set'
  const timestamp = Date.parse(dateApplied)
  if (Number.isNaN(timestamp)) return 'Date applied not set'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export default function Dashboard({ user }: Props) {
  const { data: jobs = [], isLoading: loading, error } = useJobsQuery()
  const { data: companies = [] } = useCompaniesQuery()
  const logoutMutation = useLogoutMutation()
  const createJobMutation = useCreateJobMutation()
  const updateJobMutation = useUpdateJobMutation()
  const deleteJobMutation = useDeleteJobMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<JobStatus | ''>('')
  const [search, setSearch] = useState('')

  async function handleLogout() {
    try { await logoutMutation.mutateAsync() } catch { /* cache cleared in onSettled */ }
  }

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

  const filtered = jobs
    .filter(j => {
      if (filterStatus && j.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        const company = companyName(j.companyId).toLowerCase()
        if (!j.title.toLowerCase().includes(q) && !company.includes(q)) return false
      }
      return true
    })
    .sort((left, right) => getDateAppliedTimestamp(right) - getDateAppliedTimestamp(left))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hi, {user.name || user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + Add job
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or company…"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-gray-500 dark:text-gray-400">
                {jobs.length === 0 ? 'No applications yet' : 'No jobs match your filters'}
              </p>
              {jobs.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Click <strong>+ Add job</strong> to get started.
                </p>
              )}
            </div>
          ) : filtered.map(j => (
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{companyName(j.companyId)}</p>
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
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => openEdit(j)}
                      className="text-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-1"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(j._id!)}
                      disabled={deleteJobMutation.isPending}
                      className="text-sm text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1 disabled:opacity-50"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Applied {formatAppliedDate(j.dateApplied)}</p>
                </div>
              </div>
            </div>
          ))}
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
