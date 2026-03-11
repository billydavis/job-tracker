import React, { useEffect, useState } from 'react'
import { getJobs, logout } from '../api/client'

const STATUS_STYLES = {
    applied:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    interviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    offer:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected:     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export default function Dashboard({ user, onLogout }) {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        getJobs()
            .then(data => setJobs(data || []))
            .catch(e => setError(e?.error || e?.message || 'Failed to load jobs'))
            .finally(() => setLoading(false))
    }, [])

    async function handleLogout() {
        try { await logout() } catch {}
        onLogout()
    }

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
                    {error}
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
                                <p className="font-medium text-gray-900 dark:text-white">{j.position || 'Untitled'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{j.company || '—'}</p>
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[j.status] ?? STATUS_STYLES.applied}`}>
                                {j.status ?? 'applied'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
