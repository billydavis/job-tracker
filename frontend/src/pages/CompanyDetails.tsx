import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import ApplicationJobList from '../components/ApplicationJobList'
import JobModal from '../components/JobModal'
import { jobFormToApiPayload } from '../lib/jobFormPayload'
import {
  companiesQueryKey,
  useCompaniesQuery,
  useCompanyQuery,
  useUpdateCompanyMutation,
} from '../hooks/useCompanies'
import { useDeleteJobMutation, useJobsQuery, useUpdateJobMutation } from '../hooks/useJobs'
import type { Job, JobFormData, JobFilters, JobStatus } from '../types'

/** API max per page; company detail loads all applications for this company in one request when ≤100. */
const COMPANY_JOBS_LIMIT = 100

function formatDate(value?: string) {
  if (!value) return 'Not set'
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(timestamp))
}

function dateAppliedSort(left: Job, right: Job) {
  const leftTime = left.dateApplied ? Date.parse(left.dateApplied) : Number.NEGATIVE_INFINITY
  const rightTime = right.dateApplied ? Date.parse(right.dateApplied) : Number.NEGATIVE_INFINITY
  return rightTime - leftTime
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function CompanyDetails() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const [jobPage, setJobPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)

  useEffect(() => {
    setJobPage(1)
  }, [id])

  const { data: company, isLoading: companyLoading, error: companyError } = useCompanyQuery(id)
  const { data: companies = [] } = useCompaniesQuery()

  const jobsFilters: JobFilters = useMemo(
    () => ({
      page: jobPage,
      limit: COMPANY_JOBS_LIMIT,
      search: '',
      status: '',
      companyId: id,
    }),
    [id, jobPage],
  )

  const { data: jobsResponse, isLoading: jobsListLoading, isFetching: jobsFetching, error: jobsError } = useJobsQuery(jobsFilters, {
    enabled: Boolean(id),
  })

  const updateJobMutation = useUpdateJobMutation()
  const deleteJobMutation = useDeleteJobMutation()
  const updateCompanyMutation = useUpdateCompanyMutation()

  const [markdownColorMode, setMarkdownColorMode] = useState<'light' | 'dark'>('light')
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({ website: '', description: '' })
  const [detailsSaveError, setDetailsSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const updateMode = () => {
      setMarkdownColorMode(root.classList.contains('dark') ? 'dark' : 'light')
    }
    updateMode()
    const observer = new MutationObserver(updateMode)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  function invalidateCompanyJobs() {
    queryClient.invalidateQueries({ queryKey: [...companiesQueryKey, id] })
  }

  const companyJobs = useMemo(() => {
    const rows = (jobsResponse?.data ?? []).filter((job) => job.companyId === id)
    return [...rows].sort(dateAppliedSort)
  }, [jobsResponse?.data, id])

  const applicationTotal =
    company?.jobCount !== undefined
      ? company.jobCount
      : jobsResponse?.total ?? companyJobs.length

  const total = jobsResponse?.total ?? 0
  const totalPages = jobsResponse?.totalPages ?? 1

  async function handleModalSubmit(form: JobFormData) {
    const payload = jobFormToApiPayload(form, { isEdit: Boolean(editingJob?._id) })
    if (editingJob?._id) {
      await updateJobMutation.mutateAsync({ id: editingJob._id, payload })
      invalidateCompanyJobs()
    }
    setModalOpen(false)
    setEditingJob(undefined)
  }

  function openEdit(j: Job) {
    setEditingJob(j)
    setModalOpen(true)
  }

  async function handleDelete(jobId: string) {
    if (!confirm('Delete this job?')) return
    await deleteJobMutation.mutateAsync(jobId)
    invalidateCompanyJobs()
  }

  async function handleStatusChange(j: Job, status: JobStatus) {
    if (!j._id) return
    await updateJobMutation.mutateAsync({ id: j._id, payload: { status } })
    invalidateCompanyJobs()
  }

  function beginEditCompanyDetails() {
    if (!company) return
    setDetailsForm({
      website: company.website ?? '',
      description: company.description ?? '',
    })
    setDetailsSaveError(null)
    setIsEditingDetails(true)
  }

  function cancelEditCompanyDetails() {
    setIsEditingDetails(false)
    setDetailsSaveError(null)
  }

  async function saveCompanyDetails() {
    if (!company?._id) return
    const w = detailsForm.website.trim()
    if (w && !isValidHttpUrl(w)) {
      setDetailsSaveError('Website must be a valid URL (e.g. https://example.com)')
      return
    }
    setDetailsSaveError(null)
    try {
      await updateCompanyMutation.mutateAsync({
        id: company._id,
        payload: { website: w, description: detailsForm.description },
      })
      setIsEditingDetails(false)
    } catch (err) {
      const e = err as { error?: string; message?: string }
      setDetailsSaveError(e?.message ?? e?.error ?? 'Save failed')
    }
  }

  if (companyLoading) {
    return <div className="text-gray-400 dark:text-gray-500">Loading company…</div>
  }

  if (companyError || !company) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load this company.</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Back to applications
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            ← Back
          </button>
          <Link
            to="/companies"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            All companies
          </Link>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {company.jobCount === undefined && jobsListLoading && !jobsResponse
                ? 'Loading applications…'
                : `${applicationTotal} application${applicationTotal === 1 ? '' : 's'} tracked`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditingDetails ? (
              <>
                <button
                  type="button"
                  onClick={cancelEditCompanyDetails}
                  disabled={updateCompanyMutation.isPending}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveCompanyDetails()}
                  disabled={updateCompanyMutation.isPending}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {updateCompanyMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={beginEditCompanyDetails}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit details
                </button>
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Visit website ↗
                  </a>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
            {isEditingDetails ? (
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                value={detailsForm.website}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://example.com (leave empty to remove)"
                className="mt-1.5 w-full text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 dark:text-white mt-0.5 break-all">
                {company.website || 'Not set'}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
            <p className="text-gray-900 dark:text-white mt-0.5">{formatDate(company.createdAt)}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Description</p>
          {isEditingDetails ? (
            <div data-color-mode={markdownColorMode} className="min-w-0">
              <MDEditor
                key={`company-desc-${markdownColorMode}`}
                value={detailsForm.description}
                onChange={(v) =>
                  setDetailsForm((f) => ({ ...f, description: v ?? '' }))
                }
                height={220}
                preview="live"
                visibleDragbar={false}
              />
            </div>
          ) : (
            <div
              data-color-mode={markdownColorMode}
              className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-3 py-2"
            >
              {company.description ? (
                <MDEditor.Markdown
                  source={company.description}
                  className="bg-transparent! text-sm text-slate-800 dark:text-slate-200 **:text-slate-800 dark:**:text-slate-200"
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No description yet.</p>
              )}
            </div>
          )}
        </div>

        {detailsSaveError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{detailsSaveError}</p>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Applications</h2>
        <ApplicationJobList
          jobs={companyJobs}
          companies={companies}
          loading={jobsListLoading}
          error={jobsError as { error?: string; message?: string } | null}
          isFetching={jobsFetching}
          emptyMessage="No applications for this company yet."
          page={jobsResponse?.page ?? jobPage}
          totalPages={totalPages}
          total={total}
          limit={COMPANY_JOBS_LIMIT}
          onPageChange={setJobPage}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletePending={deleteJobMutation.isPending}
          companySubtitle={company.name}
        />
      </div>

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
