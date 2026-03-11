import { useEffect, useState, type FormEvent } from 'react'
import type { Job, JobStatus, JobLocation, Company } from '../types'
import { useCreateCompanyMutation } from '../hooks/useCompanies'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm'

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

const STATUSES: JobStatus[] = [
  'waiting', 'applied', 'interview', 'offer', 'negotiation', 'rejected', 'ghosted',
]

const LOCATIONS: JobLocation[] = ['on-site', 'remote', 'hybrid']

export interface JobFormData {
  title: string
  companyId: string
  status: JobStatus
  location: JobLocation | ''
  salary: string
  url: string
  dateApplied: string
  description: string
  contact: string
}

interface Props {
  /** When set, the modal is in edit mode. */
  job?: Job
  companies: Company[]
  onSubmit: (data: JobFormData) => Promise<void>
  onClose: () => void
}

function blankForm(): JobFormData {
  return {
    title: '',
    companyId: '',
    status: 'applied',
    location: '',
    salary: '',
    url: '',
    dateApplied: '',
    description: '',
    contact: '',
  }
}

function jobToForm(job: Job): JobFormData {
  return {
    title: job.title ?? '',
    companyId: job.companyId ?? '',
    status: job.status ?? 'applied',
    location: job.location ?? '',
    salary: job.salary != null ? String(job.salary) : '',
    url: job.url ?? '',
    dateApplied: job.dateApplied ?? '',
    description: job.description ?? '',
    contact: job.contact ?? '',
  }
}

const NEW_COMPANY_SENTINEL = '__new__'

export default function JobModal({ job, companies, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<JobFormData>(() => job ? jobToForm(job) : blankForm())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCompanyName, setNewCompanyName] = useState('')
  const createCompanyMutation = useCreateCompanyMutation()

  const addingNewCompany = form.companyId === NEW_COMPANY_SENTINEL

  // Reset form when job prop changes (e.g. switching between edit targets)
  useEffect(() => {
    setForm(job ? jobToForm(job) : blankForm())
    setError(null)
    setNewCompanyName('')
  }, [job])

  function set<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      let resolvedForm = form
      if (addingNewCompany) {
        const trimmed = newCompanyName.trim()
        if (!trimmed) { setError('Please enter a company name'); setSubmitting(false); return }
        const created = await createCompanyMutation.mutateAsync({ name: trimmed })
        resolvedForm = { ...form, companyId: created._id ?? '' }
      }
      await onSubmit(resolvedForm)
      onClose()
    } catch (err) {
      const e = err as { error?: string; message?: string }
      setError(e?.error ?? e?.message ?? 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[90vh]">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {job ? 'Edit Job' : 'Add Job'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {/* Title */}
          <div>
            <label className={labelCls}>Job title *</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Software Engineer"
              required
            />
          </div>

          {/* Company */}
          <div>
            <label className={labelCls}>Company *</label>
            <select
              className={inputCls}
              value={form.companyId}
              onChange={e => {
                set('companyId', e.target.value)
                if (e.target.value !== NEW_COMPANY_SENTINEL) setNewCompanyName('')
              }}
              required={!addingNewCompany}
            >
              <option value="">Select a company…</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
              <option value={NEW_COMPANY_SENTINEL}>＋ Add new company…</option>
            </select>
            {addingNewCompany && (
              <input
                className={inputCls + ' mt-2'}
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                placeholder="Company name"
                autoFocus
                required
              />
            )}
          </div>

          {/* Status + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={e => set('status', e.target.value as JobStatus)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <select
                className={inputCls}
                value={form.location}
                onChange={e => set('location', e.target.value as JobLocation | '')}
              >
                <option value="">Any</option>
                {LOCATIONS.map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary + Date Applied */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Salary</label>
              <input
                type="number"
                className={inputCls}
                value={form.salary}
                onChange={e => set('salary', e.target.value)}
                placeholder="75000"
                min={0}
              />
            </div>
            <div>
              <label className={labelCls}>Date applied</label>
              <input
                type="date"
                className={inputCls}
                value={form.dateApplied}
                onChange={e => set('dateApplied', e.target.value)}
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className={labelCls}>Job posting URL</label>
            <input
              type="url"
              className={inputCls}
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://example.com/jobs/123"
            />
          </div>

          {/* Contact */}
          <div>
            <label className={labelCls}>Contact</label>
            <input
              className={inputCls}
              value={form.contact}
              onChange={e => set('contact', e.target.value)}
              placeholder="Recruiter name or email"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Notes / description</label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Any extra details…"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              {submitting ? 'Saving…' : job ? 'Save changes' : 'Add job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
