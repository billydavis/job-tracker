import { useEffect, useState } from 'react'
import type { Job, JobFilters, JobStatus } from '../types'
import { useJobsQuery, useCreateJobMutation, useUpdateJobMutation, useDeleteJobMutation } from '../hooks/useJobs'
import { useCompaniesQuery } from '../hooks/useCompanies'
import JobModal, { type JobFormData } from '../components/JobModal'
import ApplicationJobList from '../components/ApplicationJobList'
import { ALL_STATUSES } from '../lib/jobApplicationUi'
import { DEFAULT_PAGE_SIZE } from '../api/client'

export default function Jobs() {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Applications</h1>
        <button
          type="button"
          onClick={openCreate}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Add job
        </button>
      </div>

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
            type="button"
            onClick={() => { setFilterStatus(''); setSearch('') }}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <ApplicationJobList
        jobs={jobs}
        companies={companies}
        loading={loading}
        error={error as { error?: string; message?: string } | null}
        isFetching={isFetching}
        emptyMessage={total === 0 && !search && !filterStatus ? 'No applications yet' : 'No applications match your filters'}
        emptyHint={(
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Click <strong>+ Add job</strong> to get started.
          </p>
        )}
        showEmptyHint={total === 0 && !search && !filterStatus}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onStatusChange={handleStatusChange}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletePending={deleteJobMutation.isPending}
      />

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
