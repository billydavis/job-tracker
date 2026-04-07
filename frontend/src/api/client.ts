import type { User, Job, Company, Note, ApiError, JobFilters, PaginatedJobs } from '../types'

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

export const DEFAULT_PAGE_SIZE = 10

export function getJobs(filters: JobFilters): Promise<PaginatedJobs> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) })
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  return request(`/api/jobs?${params}`) as Promise<PaginatedJobs>
}

export function getJob(id: string): Promise<Job> {
  return request(`/api/jobs/${id}`) as Promise<Job>
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

// ── Companies ─────────────────────────────────────────────────────────────────

export function getCompanies(): Promise<Company[]> {
  return request('/api/companies') as Promise<Company[]>
}

export function getCompany(id: string): Promise<Company> {
  return request(`/api/companies/${id}`) as Promise<Company>
}

export function createCompany(payload: Pick<Company, 'name' | 'website' | 'description'>): Promise<Company> {
  return request('/api/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<Company>
}

export function updateCompany(id: string, payload: Partial<Company>): Promise<Company> {
  return request(`/api/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }) as Promise<Company>
}

export function deleteCompany(id: string): Promise<void> {
  return request(`/api/companies/${id}`, { method: 'DELETE' }) as Promise<void>
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export function getNotes(jobId: string): Promise<Note[]> {
  return request(`/api/notes?jobId=${encodeURIComponent(jobId)}`) as Promise<Note[]>
}

export function createNote(payload: { jobId: string; content: string }): Promise<Note> {
  return request('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<Note>
}

export function updateNote(id: string, content: string): Promise<Note> {
  return request(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  }) as Promise<Note>
}

export function deleteNote(id: string): Promise<void> {
  return request(`/api/notes/${id}`, { method: 'DELETE' }) as Promise<void>
}

export default {
  login, register, me, logout,
  getJobs, getJob, createJob, updateJob, deleteJob,
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany,
  getNotes, createNote, updateNote, deleteNote,
}
