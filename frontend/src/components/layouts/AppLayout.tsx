import { type Dispatch, type SetStateAction } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, User } from 'lucide-react'
import { useMeQuery, useLogoutMutation } from '../../hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface Props {
  theme: 'light' | 'dark'
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>
}

const triggerClass = 'p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer'

export default function AppLayout({ theme, setTheme }: Props) {
  const { data: user } = useMeQuery()
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    try { await logoutMutation.mutateAsync() } catch { /* cache cleared in onSettled */ }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3 flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className={triggerClass} aria-label="Navigation menu">
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => navigate('/dashboard')}
              className={location.pathname === '/dashboard' ? 'font-medium text-gray-900 dark:text-white' : ''}
            >
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/analytics')}
              className={location.pathname === '/analytics' ? 'font-medium text-gray-900 dark:text-white' : ''}
            >
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/jobs')}
              className={location.pathname === '/jobs' ? 'font-medium text-gray-900 dark:text-white' : ''}
            >
              Applications
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/companies')}
              className={
                location.pathname === '/companies' ||
                location.pathname.startsWith('/companies/')
                  ? 'font-medium text-gray-900 dark:text-white'
                  : ''
              }
            >
              Companies
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">Job Tracker</span>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className={triggerClass} aria-label="User menu">
              <User className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && (
                <DropdownMenuLabel>{user.name || user.email}</DropdownMenuLabel>
              )}
              {user && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </DropdownMenuItem>
              {user && (
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
