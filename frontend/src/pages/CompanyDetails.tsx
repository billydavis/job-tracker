import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import ApplicationJobList from '../components/ApplicationJobList'
import JobModal from '../components/JobModal'
import PageHeader from '../components/layouts/PageHeader'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
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

type CompanyDetailsLocationState = { companiesIndex?: string }

export default function CompanyDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as CompanyDetailsLocationState | null
  const companiesIndexPath = routeState?.companiesIndex
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const jobPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const prevCompanyIdRef = useRef('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)

  useEffect(() => {
    if (prevCompanyIdRef.current && prevCompanyIdRef.current !== id) {
      setSearchParams((sp) => {
        const n = new URLSearchParams(sp)
        n.delete('page')
        return n
      }, { replace: true })
    }
    prevCompanyIdRef.current = id
  }, [id, setSearchParams])

  const setJobPage = (p: number) => {
    setSearchParams((sp) => {
      const n = new URLSearchParams(sp)
      if (p <= 1) n.delete('page')
      else n.set('page', String(p))
      return n
    })
  }

  const fromListPath = useMemo(() => {
    const qs = searchParams.toString()
    return qs ? `/companies/${id}?${qs}` : `/companies/${id}`
  }, [id, searchParams])

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
    return <div className="text-slate-400 dark:text-slate-500">Loading company…</div>
  }

  if (companyError || !company) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load this company.</p>
        <Button
          type="button"
          onClick={() => navigate(companiesIndexPath ?? '/jobs')}
          variant="outline"
          size="sm"
          className="rounded-lg border-slate-300/90 bg-white/80 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        >
          {companiesIndexPath ? 'Back to companies' : 'Back to applications'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description={
          company.jobCount === undefined && jobsListLoading && !jobsResponse
            ? 'Loading applications…'
            : `${applicationTotal} application${applicationTotal === 1 ? '' : 's'} tracked`
        }
        eyebrow={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Button
              type="button"
              onClick={() => {
                if (companiesIndexPath) navigate(companiesIndexPath)
                else navigate(-1)
              }}
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              ← Back
            </Button>
            <Link
              to={companiesIndexPath ?? '/companies'}
              className="text-sm text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              All companies
            </Link>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isEditingDetails ? (
              <>
                <Button
                  type="button"
                  onClick={cancelEditCompanyDetails}
                  disabled={updateCompanyMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-slate-300/90 bg-white/80 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void saveCompanyDetails()}
                  disabled={updateCompanyMutation.isPending}
                  variant="glassPrimary"
                  size="sm"
                >
                  {updateCompanyMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={beginEditCompanyDetails}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-slate-300/90 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Edit details
                </Button>
                {company.website ? (
                  <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-300/90 bg-white/80 text-blue-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-blue-400 dark:hover:bg-white/10">
                    <a href={company.website} target="_blank" rel="noreferrer">
                      Visit website ↗
                    </a>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        }
      />

      <div className="bg-white/70 dark:bg-slate-900/55 backdrop-blur-md rounded-xl border border-white/70 dark:border-white/10 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">Website</p>
            {isEditingDetails ? (
              <Input
                type="text"
                inputMode="url"
                autoComplete="off"
                value={detailsForm.website}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://example.com (leave empty to remove)"
                className="mt-1.5 h-9 rounded-lg border-slate-300/90 bg-white/90 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            ) : (
              <p className="mt-0.5 break-all text-slate-900 dark:text-slate-100">
                {company.website || 'Not set'}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
            <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(company.createdAt)}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Description</p>
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
              className="max-h-72 overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-slate-900/35"
            >
              {company.description ? (
                <MDEditor.Markdown
                  source={company.description}
                  className="bg-transparent! text-sm text-slate-800 dark:text-slate-200 **:text-slate-800 dark:**:text-slate-200"
                />
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No description yet.</p>
              )}
            </div>
          )}
        </div>

        {detailsSaveError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{detailsSaveError}</p>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">Applications</h2>
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
          fromListPath={fromListPath}
          companiesIndexPath={companiesIndexPath}
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
