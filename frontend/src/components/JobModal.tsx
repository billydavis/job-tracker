import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Job, JobFormData, JobStatus, JobLocation, Company } from '../types'
import { useCreateCompanyMutation } from '../hooks/useCompanies'
import { formatLocalDateInput } from '../lib/jobFormPayload'
import {
  NEW_COMPANY_SENTINEL,
  jobModalSubmitSchema,
  jobModalFieldErrorsFromZod,
  type JobModalFieldKey,
} from '../lib/jobModalFormSchema'

export type { JobFormData } from '../types'

const inputErrCls =
  'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'

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
    salaryLowEnd: '',
    salaryHighEnd: '',
    salaryPeriod: 'yearly',
    url: '',
    dateApplied: formatLocalDateInput(new Date()),
    description: '',
    contact: '',
  }
}

function jobToForm(job: Job): JobFormData {
  if (job.salaryRange) {
    const { lowEnd, highEnd, period } = job.salaryRange
    return {
      title: job.title ?? '',
      companyId: job.companyId ?? '',
      status: job.status ?? 'applied',
      location: job.location ?? '',
      salaryLowEnd: lowEnd != null ? String(lowEnd) : '',
      salaryHighEnd: highEnd != null ? String(highEnd) : '',
      salaryPeriod: period ?? 'yearly',
      url: job.url ?? '',
      dateApplied: job.dateApplied ?? '',
      description: job.description ?? '',
      contact: job.contact ?? '',
    }
  }
  if (job.salary != null) {
    const s = String(job.salary)
    return {
      title: job.title ?? '',
      companyId: job.companyId ?? '',
      status: job.status ?? 'applied',
      location: job.location ?? '',
      salaryLowEnd: s,
      salaryHighEnd: s,
      salaryPeriod: 'yearly',
      url: job.url ?? '',
      dateApplied: job.dateApplied ?? '',
      description: job.description ?? '',
      contact: job.contact ?? '',
    }
  }
  return {
    title: job.title ?? '',
    companyId: job.companyId ?? '',
    status: job.status ?? 'applied',
    location: job.location ?? '',
    salaryLowEnd: '',
    salaryHighEnd: '',
    salaryPeriod: 'yearly',
    url: job.url ?? '',
    dateApplied: job.dateApplied ?? '',
    description: job.description ?? '',
    contact: job.contact ?? '',
  }
}

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
  inputId?: string
  ariaInvalid?: boolean
  ariaErrorMessage?: string
}

function CompanyCombobox({
  companies,
  selectedId,
  newCompanyName,
  onSelectExisting,
  onCreateNew,
  onClear,
  inputId,
  ariaInvalid,
  ariaErrorMessage,
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
        id={inputId}
        className={inputCls + (ariaInvalid ? ` ${inputErrCls}` : '')}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search or create company…"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={dropdownVisible}
        aria-invalid={ariaInvalid || undefined}
        aria-errormessage={ariaErrorMessage}
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

const formKeyToFieldError: Partial<Record<keyof JobFormData, JobModalFieldKey>> = {
  title: 'title',
  dateApplied: 'dateApplied',
  salaryLowEnd: 'salaryLowEnd',
  salaryHighEnd: 'salaryHighEnd',
  url: 'url',
  contact: 'contact',
  description: 'description',
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
      {message}
    </p>
  )
}

export default function JobModal({ job, companies, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<JobFormData>(() => job ? jobToForm(job) : blankForm())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<JobModalFieldKey, string>>>({})
  const [newCompanyName, setNewCompanyName] = useState('')
  const createCompanyMutation = useCreateCompanyMutation()

  const isCreatingCompany = form.companyId === NEW_COMPANY_SENTINEL

  // Reset form when job prop changes (e.g. switching between edit targets)
  useEffect(() => {
    setForm(job ? jobToForm(job) : blankForm())
    setError(null)
    setFieldErrors({})
    setNewCompanyName('')
  }, [job])

  function clearFieldError(key: JobModalFieldKey) {
    setFieldErrors((e) => {
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  function clearCompanyFieldErrors() {
    setFieldErrors((e) => {
      if (!e.companyId && !e.newCompanyName) return e
      const next = { ...e }
      delete next.companyId
      delete next.newCompanyName
      return next
    })
  }

  function set<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    const errKey = formKeyToFieldError[key]
    if (errKey) clearFieldError(errKey)
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const parsed = jobModalSubmitSchema.safeParse({ ...form, newCompanyName })
    if (!parsed.success) {
      setFieldErrors(jobModalFieldErrorsFromZod(parsed.error))
      return
    }

    setSubmitting(true)
    try {
      let resolvedForm = form
      if (isCreatingCompany) {
        const trimmed = newCompanyName.trim()
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

        <form noValidate onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {/* Company — first field */}
          <div>
            <label className={labelCls} htmlFor="job-modal-company">Company *</label>
            <CompanyCombobox
              inputId="job-modal-company"
              companies={companies}
              selectedId={form.companyId}
              newCompanyName={newCompanyName}
              onSelectExisting={id => {
                clearCompanyFieldErrors()
                setForm(f => ({ ...f, companyId: id }))
                setNewCompanyName('')
              }}
              onCreateNew={name => {
                clearCompanyFieldErrors()
                setForm(f => ({ ...f, companyId: NEW_COMPANY_SENTINEL }))
                setNewCompanyName(name)
              }}
              onClear={() => {
                clearCompanyFieldErrors()
                setForm(f => ({ ...f, companyId: '' }))
                setNewCompanyName('')
              }}
              ariaInvalid={Boolean(fieldErrors.companyId || fieldErrors.newCompanyName)}
              ariaErrorMessage={
                fieldErrors.companyId ?? fieldErrors.newCompanyName
                  ? 'job-modal-company-error'
                  : undefined
              }
            />
            <FieldError
              id="job-modal-company-error"
              message={fieldErrors.companyId ?? fieldErrors.newCompanyName}
            />
          </div>

          {/* Title + Date applied (2/3 + 1/3) */}
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-start">
            <div className="min-w-0">
              <label className={labelCls} htmlFor="job-modal-title">Job title *</label>
              <input
                id="job-modal-title"
                className={inputCls + (fieldErrors.title ? ` ${inputErrCls}` : '')}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Software Engineer"
                aria-invalid={fieldErrors.title ? true : undefined}
                aria-describedby={fieldErrors.title ? 'job-modal-title-error' : undefined}
              />
              <FieldError id="job-modal-title-error" message={fieldErrors.title} />
            </div>
            <div className="min-w-0">
              <label className={labelCls} htmlFor="job-modal-date-applied">Date applied</label>
              <input
                id="job-modal-date-applied"
                type="date"
                className={
                  inputCls +
                  ' w-full min-w-0' +
                  (fieldErrors.dateApplied ? ` ${inputErrCls}` : '')
                }
                value={form.dateApplied}
                onChange={e => set('dateApplied', e.target.value)}
                aria-invalid={fieldErrors.dateApplied ? true : undefined}
                aria-describedby={fieldErrors.dateApplied ? 'job-modal-date-error' : undefined}
              />
              <FieldError id="job-modal-date-error" message={fieldErrors.dateApplied} />
            </div>
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

          {/* Salary range */}
          <div>
            <label className={labelCls}>Salary range</label>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-start">
              <div className="min-w-0">
                <input
                  type="number"
                  className={
                    inputCls +
                    ' min-w-0 w-full' +
                    (fieldErrors.salaryLowEnd ? ` ${inputErrCls}` : '')
                  }
                  value={form.salaryLowEnd}
                  onChange={e => set('salaryLowEnd', e.target.value)}
                  placeholder="Low"
                  min={0}
                  aria-label="Salary low end"
                  aria-invalid={fieldErrors.salaryLowEnd ? true : undefined}
                  aria-describedby={fieldErrors.salaryLowEnd ? 'job-modal-salary-low-error' : undefined}
                />
                <FieldError id="job-modal-salary-low-error" message={fieldErrors.salaryLowEnd} />
              </div>
              <div className="min-w-0">
                <input
                  type="number"
                  className={
                    inputCls +
                    ' min-w-0 w-full' +
                    (fieldErrors.salaryHighEnd ? ` ${inputErrCls}` : '')
                  }
                  value={form.salaryHighEnd}
                  onChange={e => set('salaryHighEnd', e.target.value)}
                  placeholder="High"
                  min={0}
                  aria-label="Salary high end"
                  aria-invalid={fieldErrors.salaryHighEnd ? true : undefined}
                  aria-describedby={fieldErrors.salaryHighEnd ? 'job-modal-salary-high-error' : undefined}
                />
                <FieldError id="job-modal-salary-high-error" message={fieldErrors.salaryHighEnd} />
              </div>
              <select
                className={
                  inputCls +
                  ' w-24 shrink-0 px-2 py-1.5 text-xs font-normal'
                }
                value={form.salaryPeriod}
                onChange={e => set('salaryPeriod', e.target.value as JobFormData['salaryPeriod'])}
                aria-label="Pay period"
              >
                <option value="yearly">Yearly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className={labelCls} htmlFor="job-modal-url">Job posting URL</label>
            <input
              id="job-modal-url"
              type="url"
              className={inputCls + (fieldErrors.url ? ` ${inputErrCls}` : '')}
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://example.com/jobs/123"
              aria-invalid={fieldErrors.url ? true : undefined}
              aria-describedby={fieldErrors.url ? 'job-modal-url-error' : undefined}
            />
            <FieldError id="job-modal-url-error" message={fieldErrors.url} />
          </div>

          {/* Contact */}
          <div>
            <label className={labelCls} htmlFor="job-modal-contact">Contact</label>
            <input
              id="job-modal-contact"
              className={inputCls + (fieldErrors.contact ? ` ${inputErrCls}` : '')}
              value={form.contact}
              onChange={e => set('contact', e.target.value)}
              placeholder="Recruiter name or email"
              aria-invalid={fieldErrors.contact ? true : undefined}
              aria-describedby={fieldErrors.contact ? 'job-modal-contact-error' : undefined}
            />
            <FieldError id="job-modal-contact-error" message={fieldErrors.contact} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls} htmlFor="job-modal-description">Job Description</label>
            <textarea
              id="job-modal-description"
              className={inputCls + ' resize-none' + (fieldErrors.description ? ` ${inputErrCls}` : '')}
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Any extra details…"
              aria-invalid={fieldErrors.description ? true : undefined}
              aria-describedby={fieldErrors.description ? 'job-modal-description-error' : undefined}
            />
            <FieldError id="job-modal-description-error" message={fieldErrors.description} />
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
