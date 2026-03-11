import { type Dispatch, type SetStateAction } from 'react'
import { Outlet } from 'react-router-dom'

interface Props {
  theme: 'light' | 'dark'
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>
}

export default function AppLayout({ theme, setTheme }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">Job Tracker</span>
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
