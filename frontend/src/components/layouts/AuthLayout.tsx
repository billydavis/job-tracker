import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
