import { Link, useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { useCompanyQuery } from '../hooks/useCompanies'
import { useJobsQuery } from '../hooks/useJobs'
import type { Job } from '../types'

function formatDate(value?: string) {
  if (!value) return 'Not set'
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(timestamp))
}

function dateAppliedSort(left: Job, right: Job) {
  const leftTime = left.dateApplied ? Date.parse(left.dateApplied) : Number.NEGATIVE_INFINITY
  const rightTime = right.dateApplied ? Date.parse(right.dateApplied) : Number.NEGATIVE_INFINITY
  return rightTime - leftTime
}

export default function CompanyDetails() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''

  const { data: company, isLoading: companyLoading, error: companyError } = useCompanyQuery(id)
  const { data: jobs = [], isLoading: jobsLoading } = useJobsQuery()

  const companyJobs = jobs
    .filter((job) => job.companyId === id)
    .sort(dateAppliedSort)

  if (companyLoading) {
    return <div className="text-gray-400 dark:text-gray-500">Loading company…</div>
  }

  if (companyError || !company) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load this company.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          ← Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {companyJobs.length} job{companyJobs.length === 1 ? '' : 's'} tracked
            </p>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Visit website ↗
            </a>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
            <p className="text-gray-900 dark:text-white mt-0.5 break-all">{company.website || 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
            <p className="text-gray-900 dark:text-white mt-0.5">{formatDate(company.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Company Notes</h2>
          <div data-color-mode="light" className="min-h-28">
            {company.description ? (
              <MDEditor.Markdown source={company.description} className="bg-transparent! text-sm text-slate-800 dark:text-slate-200 **:text-slate-800 dark:**:text-slate-200" />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">No company description yet.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Applied Jobs</h2>
          {jobsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading jobs…</p>
          ) : companyJobs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No jobs for this company yet.</p>
          ) : (
            <ul className="space-y-2">
              {companyJobs.map(job => (
                <li key={job._id} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <Link to={`/jobs/${job._id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {job.title}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applied {formatDate(job.dateApplied)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
