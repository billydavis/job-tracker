import { useState, type FormEvent } from 'react'
import { useLoginMutation, useRegisterMutation } from '../hooks/useAuth'

const inputCls = [
  'w-full px-3 py-2 rounded-lg border',
  'border-gray-300 dark:border-gray-600',
  'bg-white dark:bg-gray-700',
  'text-gray-900 dark:text-white',
  'placeholder-gray-400 dark:placeholder-gray-500',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'transition-colors',
].join(' ')

interface PasswordStrength {
  label: 'Weak' | 'Medium' | 'Strong'
  color: string
}

function getPasswordStrength(value: string): PasswordStrength {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  if (score <= 2) return { label: 'Weak', color: 'bg-red-500' }
  if (score <= 4) return { label: 'Medium', color: 'bg-amber-500' }
  return { label: 'Strong', color: 'bg-emerald-500' }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loginMutation = useLoginMutation()
  const registerMutation = useRegisterMutation()

  const passwordStrength = getPasswordStrength(password)
  const showPasswordChecks = isRegister && password.length > 0

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (passwordStrength.label === 'Weak') {
        setError('Please choose a stronger password')
        return
      }
    }

    try {
      if (isRegister) {
        await registerMutation.mutateAsync({ name, email, password })
      } else {
        await loginMutation.mutateAsync({ email, password })
      }
    } catch (err) {
      const e = err as { error?: string; message?: string }
      setError(e?.error ?? e?.message ?? 'Request failed')
    }
  }

  const submitting = loginMutation.isPending || registerMutation.isPending

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
            {showPasswordChecks && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Password strength</span>
                  <span className="font-medium">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all`}
                    style={{ width: `${(Math.min(password.length, 12) / 12) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
              <input
                type="password"
                className={inputCls}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

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
