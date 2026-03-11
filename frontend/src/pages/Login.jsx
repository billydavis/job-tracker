import React, { useState } from 'react'
import { login, register } from '../api/client'

const inputCls = [
    'w-full px-3 py-2 rounded-lg border',
    'border-gray-300 dark:border-gray-600',
    'bg-white dark:bg-gray-700',
    'text-gray-900 dark:text-white',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors',
].join(' ')

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isRegister, setIsRegister] = useState(false)
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            const res = isRegister
                ? await register({ name, email, password })
                : await login({ email, password })
            onLogin(res)
        } catch (err) {
            setError(err?.error || err?.message || 'Request failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex justify-center pt-12">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {isRegister ? 'Create account' : 'Sign in'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {isRegister ? 'Start tracking your applications.' : 'Welcome back.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
                    >
                        {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        onClick={() => { setIsRegister(s => !s); setError(null) }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                        {isRegister ? 'Sign in' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    )
}
