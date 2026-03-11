const BASE = import.meta.env.VITE_API_BASE || ''

async function request(path, opts = {}) {
    const res = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw err
    }
    return res.json().catch(() => null)
}

export function login({ email, password }) {
    return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }).then((r) => r?.user ?? r)
}

export function register({ name, email, password }) {
    return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    }).then((r) => r?.user ?? r)
}

export function me() {
    return request('/api/auth/me').then((r) => r?.user ?? r)
}

export function logout() {
    return request('/api/auth/logout', { method: 'POST' })
}

export function getJobs() {
    return request('/api/jobs')
}

export default { login, register, me, logout, getJobs }
