import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { me } from './api/client'

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'light'
        return localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    })

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        me()
            .then((res) => { if (res?._id) setUser(res) })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-gray-400 dark:text-gray-500">Loading…</div>
        </div>
    )

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
                {user
                    ? <Dashboard user={user} onLogout={() => setUser(null)} />
                    : <Login onLogin={setUser} />
                }
            </main>
        </div>
    )
}
