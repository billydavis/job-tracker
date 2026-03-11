import type { User, Job, ApiError } from '../types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function buildError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({})) as Record<string, unknown>
  return {
    ...body,
    status: res.status,
    message: (body['message'] ?? body['error'] ?? `Request failed (${res.status})`) as string,
  }
}

interface RequestConfig {
  retryOn401?: boolean
}

async function request(path: string, opts: RequestInit = {}, config: RequestConfig = {}): Promise<unknown> {
  const { retryOn401 = true } = config
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((opts.headers as Record<string, string>) ?? {}),
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers,
    ...opts,
  })

  if (
    res.status === 401 &&
    retryOn401 &&
    path !== '/api/auth/refresh' &&
    path !== '/api/auth/login' &&
    path !== '/api/auth/register' &&
    path !== '/api/auth/logout'
  ) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return request(path, opts, { retryOn401: false })
    }
  }

  if (!res.ok) {
    throw await buildError(res)
  }

  return res.json().catch(() => null)
}

function extractUser(r: unknown): User {
  const res = r as { user?: User } | User
  return (res && typeof res === 'object' && 'user' in res && res.user ? res.user : res) as User
}

export function login(credentials: { email: string; password: string }): Promise<User> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }).then(extractUser)
}

export function register(payload: { name: string; email: string; password: string }): Promise<User> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(extractUser)
}

export function me(): Promise<User> {
  return request('/api/auth/me').then(extractUser)
}

export function logout(): Promise<void> {
  return request('/api/auth/logout', { method: 'POST' }) as Promise<void>
}

export function getJobs(): Promise<Job[]> {
  return request('/api/jobs') as Promise<Job[]>
}

export function createJob(payload: Partial<Job>): Promise<Job> {
  return request('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<Job>
}

export function updateJob(id: string, payload: Partial<Job>): Promise<Job> {
  return request(`/api/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }) as Promise<Job>
}

export function deleteJob(id: string): Promise<void> {
  return request(`/api/jobs/${id}`, {
    method: 'DELETE',
  }) as Promise<void>
}

export default { login, register, me, logout, getJobs, createJob, updateJob, deleteJob }
