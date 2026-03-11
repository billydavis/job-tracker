import type { User } from '../types'
import { useJobsQuery } from '../hooks/useJobs'
import { useLogoutMutation } from '../hooks/useAuth'

const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  interviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const DEFAULT_STYLE = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'

interface Props {
  user: User
}

export default function Dashboard({ user }: Props) {
  const { data: jobs = [], isLoading: loading, error } = useJobsQuery()
  const logoutMutation = useLogoutMutation()

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // The auth cache is still cleared by the mutation onSettled handler.
    }
  }

  const errObj = error as { error?: string; message?: string } | null
  const errorMessage = errObj?.error ?? errObj?.message ?? 'Failed to load jobs'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hi, {user.name || user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      {loading && <div className="text-gray-400 dark:text-gray-500">Loading…</div>}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3">
          {errorMessage}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {jobs.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-gray-500 dark:text-gray-400">No applications yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first job to get started.</p>
            </div>
          ) : jobs.map(j => (
            <div key={j._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{j.title || 'Untitled'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{j.companyId ?? '—'}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[j.status] ?? DEFAULT_STYLE}`}>
                {j.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
