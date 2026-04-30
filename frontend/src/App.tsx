import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import Companies from './pages/Companies'
import CompanyDetails from './pages/CompanyDetails'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/routes/ProtectedRoute'
import PublicOnlyRoute from './components/routes/PublicOnlyRoute'
import AuthLayout from './components/layouts/AuthLayout'
import AppLayout from './components/layouts/AppLayout'
import { useMeQuery } from './hooks/useAuth'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('theme') as 'light' | 'dark' | null) ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  const { data: user = null, isLoading } = useMeQuery()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-gray-400 dark:text-gray-500">Loading…</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

      <Route
        element={
          <PublicOnlyRoute user={user}>
            <AuthLayout />
          </PublicOnlyRoute>
        }
      >
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        element={
          <ProtectedRoute user={user}>
            <AppLayout theme={theme} setTheme={setTheme} />
          </ProtectedRoute>
        }
      >
        {/* user is guaranteed non-null inside ProtectedRoute */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetails />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
