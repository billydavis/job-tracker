import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { JobStats } from '../../types'
import AnalyticsCard from './AnalyticsCard'

interface Props {
  data: JobStats['recentApplications'] | undefined
  isLoading: boolean
}

const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function formatDate(d: string) {
  const parsed = new Date(d)
  return isNaN(parsed.getTime()) ? d : fmt.format(parsed)
}

export default function RecentApplicationsWidget({ data, isLoading }: Props) {
  return (
    <AnalyticsCard
      title="Recent Applications"
      className="h-full md:col-span-2"
      titleRight={
        <Link
          to="/jobs"
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all applications <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No applications yet.</p>
            <Link
              to="/jobs"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add job application
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.map(app => (
              <li key={app.jobId}>
                <Link
                  to={`/jobs/${app.jobId}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {app.companyName ?? 'Unknown company'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{app.title}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-4">
                    {app.dateApplied ? formatDate(app.dateApplied) : '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </AnalyticsCard>
  )
}
