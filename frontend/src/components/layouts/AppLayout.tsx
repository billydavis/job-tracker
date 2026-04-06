import { type Dispatch, type SetStateAction } from 'react'
import { Outlet } from 'react-router-dom'
import { useMeQuery, useLogoutMutation } from '../../hooks/useAuth'

interface Props {
  theme: 'light' | 'dark'
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>
}

export default function AppLayout({ theme, setTheme }: Props) {
  const { data: user } = useMeQuery()
  const logoutMutation = useLogoutMutation()

  async function handleLogout() {
    try { await logoutMutation.mutateAsync() } catch { /* cache cleared in onSettled */ }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">Job Tracker</span>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {user.name || user.email}
            </span>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          )}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
