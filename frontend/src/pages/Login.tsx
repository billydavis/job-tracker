import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useLoginMutation, useRegisterMutation } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const authInputClass =
  'auth-input border-slate-300/90 bg-white/80 text-slate-900 placeholder:text-slate-500 ' +
  'focus-visible:border-slate-400/80 focus-visible:ring-2 focus-visible:ring-slate-300/45 ' +
  'dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-400 ' +
  'dark:focus-visible:border-white/25 dark:focus-visible:ring-white/20'

interface PasswordStrength {
  label: 'Weak' | 'Medium' | 'Strong'
  color: string
}

function getFriendlyAuthError(error: unknown, isRegister: boolean): string {
  const e = error as { error?: string; message?: string }
  const raw = (e?.error ?? e?.message ?? '').trim()
  const normalized = raw.toLowerCase()

  if (!isRegister) {
    const looksLikeCredentialError =
      normalized.includes('invalid credentials') ||
      normalized.includes('invalid email or password') ||
      normalized.includes('incorrect password') ||
      normalized.includes('wrong password') ||
      normalized.includes('user not found') ||
      normalized.includes('unauthorized')

    if (looksLikeCredentialError) {
      return 'Invalid email or password. Please try again.'
    }
  }

  return raw || 'Request failed'
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      setError(getFriendlyAuthError(err, isRegister))
    }
  }

  const submitting = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="mx-auto flex w-full max-w-md justify-center pt-8 md:pt-12">
      <Card className="w-full gap-0 rounded-2xl border-white/70 bg-white/70 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.5)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {isRegister ? 'Create account' : 'Sign in'}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            {isRegister ? 'Start tracking your applications.' : 'Welcome back.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-200">
                  Name
                </Label>
                <Input
                  id="name"
                  className={authInputClass}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className={authInputClass}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${authInputClass} pr-10`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            {showPasswordChecks && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Password strength</span>
                  <span className="font-medium">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all`}
                    style={{ width: `${(Math.min(password.length, 12) / 12) * 100}%` }}
                  />
                </div>
              </div>
            )}
            </div>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`${authInputClass} pr-10`}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200/90 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              variant="glassPrimary"
              className="mt-2 h-10 w-full rounded-lg"
            >
              {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-300">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setIsRegister(s => !s); setError(null) }}
              className="font-medium text-slate-800 underline-offset-4 hover:underline dark:text-slate-100"
            >
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
