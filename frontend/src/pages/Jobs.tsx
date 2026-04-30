import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import type { Job, JobFormData, JobFilters, JobStatus } from '../types'
import { useJobsQuery, useCreateJobMutation, useUpdateJobMutation, useDeleteJobMutation } from '../hooks/useJobs'
import { useCompaniesQuery } from '../hooks/useCompanies'
import JobModal from '../components/JobModal'
import { jobFormToApiPayload } from '../lib/jobFormPayload'
import ApplicationJobList from '../components/ApplicationJobList'
import PageHeader from '../components/layouts/PageHeader'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ALL_STATUSES } from '../lib/jobApplicationUi'
import { getListPageSize, setListPageSize } from '../lib/listPageSize'

export default function Jobs() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<JobStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(() => getListPageSize())

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
    const payload = jobFormToApiPayload(form, { isEdit: Boolean(editingJob?._id) })
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
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Manage your pipeline, update statuses, and keep your search moving."
        actions={
          <Button
            type="button"
            onClick={openCreate}
            variant="glassPrimary"
          >
            + Add Application
          </Button>
        }
      />

      <section className="space-y-0">
        <div className="bg-white/70 dark:bg-slate-900/55 backdrop-blur-md rounded-t-2xl rounded-b-none border border-white/70 dark:border-white/10 border-b-gray-200/70 dark:border-b-white/10 px-4 py-3 flex flex-wrap gap-2">
          <div className="relative min-w-52">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title…"
              className="h-9 rounded-lg border-slate-300/90 bg-white/90 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>
          <Select
            value={filterStatus === '' ? 'all' : filterStatus}
            onValueChange={(value) => setFilterStatus(value === 'all' ? '' : (value as JobStatus))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterStatus || search) && (
            <Button
              type="button"
              onClick={() => { setFilterStatus(''); setSearch('') }}
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-300/90 bg-white/80 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Clear
            </Button>
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
          onLimitChange={(n) => {
            setListPageSize(n)
            setLimit(n)
            setPage(1)
          }}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletePending={deleteJobMutation.isPending}
          attachedToFilters
        />
      </section>

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
