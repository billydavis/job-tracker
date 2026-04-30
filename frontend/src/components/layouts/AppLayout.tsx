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

const triggerClass =
  'p-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 ' +
  'text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 ' +
  'backdrop-blur-md transition-colors cursor-pointer'

export default function AppLayout({ theme, setTheme }: Props) {
  const { data: user } = useMeQuery()
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    try { await logoutMutation.mutateAsync() } catch { /* cache cleared in onSettled */ }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-200 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center gap-3 border-b border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_24px_-20px_rgba(15,23,42,0.7)]">
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

        <span className="font-semibold text-slate-900 dark:text-slate-100 text-lg tracking-tight">Job Tracker</span>

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
