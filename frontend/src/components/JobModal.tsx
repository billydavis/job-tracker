import { useEffect, useRef, useState, type FormEvent } from 'react'
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

// ---------------------------------------------------------------------------
// CompanyCombobox
// ---------------------------------------------------------------------------

interface CompanyComboboxProps {
  companies: Company[]
  selectedId: string        // '' | '__new__' | actual company _id
  newCompanyName: string    // only relevant when selectedId === '__new__'
  onSelectExisting: (id: string) => void
  onCreateNew: (name: string) => void
  onClear: () => void
}

function CompanyCombobox({
  companies,
  selectedId,
  newCompanyName,
  onSelectExisting,
  onCreateNew,
  onClear,
}: CompanyComboboxProps) {
  const isCreating = selectedId === NEW_COMPANY_SENTINEL
  const selectedCompany = companies.find(c => c._id === selectedId)

  const [inputValue, setInputValue] = useState(() => {
    if (isCreating) return newCompanyName
    if (selectedCompany) return selectedCompany.name
    return ''
  })
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const listRef = useRef<HTMLUListElement>(null)

  // Sync input display when parent state resets (e.g. job prop changes)
  useEffect(() => {
    if (isCreating) setInputValue(newCompanyName)
    else if (selectedCompany) setInputValue(selectedCompany.name)
    else setInputValue('')
  }, [selectedId, newCompanyName]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = companies
    .filter(c => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const exactMatch = companies.find(
    c => c.name.toLowerCase() === inputValue.trim().toLowerCase(),
  )

  const showCreate = inputValue.trim().length > 0 && !exactMatch

  function selectCompany(c: Company) {
    setInputValue(c.name)
    setIsOpen(false)
    setActiveIndex(-1)
    onSelectExisting(c._id!)
  }

  function selectCreate() {
    const name = inputValue.trim()
    setIsOpen(false)
    setActiveIndex(-1)
    onCreateNew(name)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    setIsOpen(true)
    setActiveIndex(-1)
    if (!e.target.value.trim()) onClear()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const total = filtered.length + (showCreate ? 1 : 0)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) { setIsOpen(true); return }
      setActiveIndex(i => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!isOpen || activeIndex === -1) return
      if (activeIndex < filtered.length) selectCompany(filtered[activeIndex])
      else selectCreate()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  function handleBlur(e: React.FocusEvent) {
    if (listRef.current?.contains(e.relatedTarget as Node)) return
    setIsOpen(false)
    setActiveIndex(-1)

    const trimmed = inputValue.trim()
    if (!trimmed) { onClear(); return }

    // Auto-select if the typed text exactly matches an existing company
    const exact = companies.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
    if (exact) { setInputValue(exact.name); onSelectExisting(exact._id!); return }

    // If already in "create" mode, keep it
    if (isCreating) return

    // Revert to previously selected company name or clear
    if (selectedCompany) setInputValue(selectedCompany.name)
    else setInputValue('')
  }

  const dropdownVisible = isOpen && (filtered.length > 0 || showCreate)

  return (
    <div className="relative">
      <input
        className={inputCls}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search or create company…"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={dropdownVisible}
      />
      {dropdownVisible && (
        <ul
          ref={listRef}
          className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((c, i) => (
            <li
              key={c._id}
              onMouseDown={e => { e.preventDefault(); selectCompany(c) }}
              className={
                'px-3 py-2 text-sm cursor-pointer text-gray-900 dark:text-white ' +
                (activeIndex === i
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600')
              }
            >
              {c.name}
            </li>
          ))}
          {showCreate && (
            <li
              onMouseDown={e => { e.preventDefault(); selectCreate() }}
              className={
                'px-3 py-2 text-sm cursor-pointer font-medium text-blue-600 dark:text-blue-400 ' +
                (activeIndex === filtered.length
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600')
              }
            >
              Create &ldquo;{inputValue.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// JobModal
// ---------------------------------------------------------------------------

export default function JobModal({ job, companies, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<JobFormData>(() => job ? jobToForm(job) : blankForm())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCompanyName, setNewCompanyName] = useState('')
  const createCompanyMutation = useCreateCompanyMutation()

  const isCreatingCompany = form.companyId === NEW_COMPANY_SENTINEL

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

    if (!form.companyId) {
      setError('Please select or create a company')
      return
    }

    setSubmitting(true)
    try {
      let resolvedForm = form
      if (isCreatingCompany) {
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
          {/* Company — first field */}
          <div>
            <label className={labelCls}>Company *</label>
            <CompanyCombobox
              companies={companies}
              selectedId={form.companyId}
              newCompanyName={newCompanyName}
              onSelectExisting={id => { set('companyId', id); setNewCompanyName('') }}
              onCreateNew={name => { set('companyId', NEW_COMPANY_SENTINEL); setNewCompanyName(name) }}
              onClear={() => { set('companyId', ''); setNewCompanyName('') }}
            />
          </div>

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
            <label className={labelCls}>Job Description</label>
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
