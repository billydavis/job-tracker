import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { Pencil } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useCompaniesQuery } from '../hooks/useCompanies'
import { useJobQuery, useJobsQuery, useUpdateJobMutation } from '../hooks/useJobs'
import { useNotesQuery } from '../hooks/useNotes'
import JobModal from '../components/JobModal'
import NotesPanel from '../components/NotesPanel'
import PageHeader from '../components/layouts/PageHeader'
import { DEFAULT_PAGE_SIZE } from '../api/client'
import { jobFormToApiPayload } from '../lib/jobFormPayload'
import type { JobFilters, JobFormData, JobStatus } from '../types'
import { formatJobSalary } from '../lib/formatJobSalary'

const STATUS_STYLES: Record<JobStatus, string> = {
  waiting: 'bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  interview: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  negotiation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  ghosted: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

function formatDate(value?: string) {
  if (!value) return 'Not set'
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(timestamp))
}

function toTimestamp(value?: string) {
  if (!value) return Number.NEGATIVE_INFINITY
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

type TimelineItem = {
  id: string
  timestamp: number
  label: string
  detail: string
}

const jobDetailsFilters: JobFilters = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  search: '',
  status: '',
}

export default function JobDetails() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''

  const { data: job, isLoading, error } = useJobQuery(id)
  const { data: jobsResponse } = useJobsQuery(jobDetailsFilters)
  const jobs = jobsResponse?.data ?? []
  const { data: companies = [] } = useCompaniesQuery()
  const { data: notes = [] } = useNotesQuery(id)
  const updateJobMutation = useUpdateJobMutation()

  const [markdownColorMode, setMarkdownColorMode] = useState<'light' | 'dark'>('light')

  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const updateMode = () => {
      setMarkdownColorMode(root.classList.contains('dark') ? 'dark' : 'light')
    }

    updateMode()

    const observer = new MutationObserver(updateMode)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((left, right) => {
      const dateDiff = toTimestamp(right.dateApplied) - toTimestamp(left.dateApplied)
      if (dateDiff !== 0) return dateDiff
      const createdDiff = toTimestamp(right.createdAt) - toTimestamp(left.createdAt)
      if (createdDiff !== 0) return createdDiff
      return (left._id ?? '').localeCompare(right._id ?? '')
    })
  }, [jobs])

  const activeIndex = sortedJobs.findIndex(j => j._id === id)
  const previousJob = activeIndex > 0 ? sortedJobs[activeIndex - 1] : null
  const nextJob = activeIndex >= 0 && activeIndex < sortedJobs.length - 1 ? sortedJobs[activeIndex + 1] : null

  const companyName = companies.find(c => c._id === job?.companyId)?.name ?? job?.companyId ?? '—'

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!job) return []

    const items: TimelineItem[] = []

    items.push({
      id: `status-${job._id ?? id}`,
      timestamp: toTimestamp(job.updatedAt ?? job.dateApplied ?? job.createdAt),
      label: 'Status',
      detail: `Current status: ${job.status}`,
    })

    for (const note of notes) {
      items.push({
        id: note._id ?? `note-${Math.random()}`,
        timestamp: toTimestamp(note.updatedAt ?? note.createdAt),
        label: note.updatedAt ? 'Note updated' : 'Note added',
        detail: note.content,
      })
    }

    return items.sort((left, right) => right.timestamp - left.timestamp)
  }, [job, notes, id])

  function beginDescriptionEdit() {
    setDescriptionDraft(job?.description ?? '')
    setDescriptionError(null)
    setIsEditingDescription(true)
  }

  async function saveDescription() {
    if (!job?._id) return
    try {
      setDescriptionError(null)
      await updateJobMutation.mutateAsync({
        id: job._id,
        payload: { description: descriptionDraft.trim() || undefined },
      })
      setIsEditingDescription(false)
    } catch (err) {
      const e = err as { error?: string; message?: string }
      setDescriptionError(e?.error ?? e?.message ?? 'Could not save description')
    }
  }

  async function handleJobModalSubmit(form: JobFormData) {
    const jobId = job?._id
    if (!jobId) return
    const payload = jobFormToApiPayload(form, { isEdit: true })
    await updateJobMutation.mutateAsync({ id: jobId, payload })
  }

  useEffect(() => {
    if (!isEditingDescription) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsEditingDescription(false)
        setDescriptionError(null)
        return
      }

      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && key === 's') {
        event.preventDefault()
        void saveDescription()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isEditingDescription, descriptionDraft, job?._id])

  if (isLoading) {
    return <div className="text-slate-400 dark:text-slate-500">Loading job…</div>
  }

  if (error || !job) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load this job.</p>
        <Button
          type="button"
          onClick={() => navigate('/jobs')}
          variant="outline"
          size="sm"
          className="rounded-lg border-slate-300/90 bg-white/80 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        >
          Back to applications
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        description={companyName}
        eyebrow={(
          <Button
            type="button"
            onClick={() => navigate('/jobs')}
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
          >
            ← Back to applications
          </Button>
        )}
        actions={(
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status]}`}>
                {job.status}
              </span>
              <Button
                type="button"
                onClick={() => setEditModalOpen(true)}
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 rounded-lg border-slate-300/90 bg-white/80 px-2.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Pencil className="size-3.5 shrink-0" aria-hidden />
                Edit job
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => previousJob && navigate(`/jobs/${previousJob._id}`)}
                disabled={!previousJob}
                variant="outline"
                size="sm"
                className="h-7 rounded-md border-slate-300/90 bg-white/80 px-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Prev
              </Button>
              <Button
                type="button"
                onClick={() => nextJob && navigate(`/jobs/${nextJob._id}`)}
                disabled={!nextJob}
                variant="outline"
                size="sm"
                className="h-7 rounded-md border-slate-300/90 bg-white/80 px-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      />

      <div className="bg-white/70 dark:bg-slate-900/55 backdrop-blur-md rounded-xl border border-white/70 dark:border-white/10 p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200/80 dark:border-white/10 px-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Applied</p>
            <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(job.dateApplied)}</p>
          </div>
          <div className="rounded-lg border border-slate-200/80 dark:border-white/10 px-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
            <p className="mt-0.5 text-slate-900 dark:text-slate-100">{job.location ?? 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-slate-200/80 dark:border-white/10 px-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Salary</p>
            <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatJobSalary(job) ?? 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-slate-200/80 dark:border-white/10 px-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Contact</p>
            <p className="mt-0.5 text-slate-900 dark:text-slate-100">{job.contact ?? 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-slate-200/80 dark:border-white/10 px-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Posting</p>
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block"
              >
                Open ↗
              </a>
            ) : (
              <p className="mt-0.5 text-slate-900 dark:text-slate-100">Not set</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-xl border border-white/70 bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Description</h2>
            <Button
              type="button"
              onClick={beginDescriptionEdit}
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Edit
            </Button>
          </div>

          <div className="min-h-40" data-color-mode={markdownColorMode}>
            {job.description ? (
              <MDEditor.Markdown
                key={`markdown-${markdownColorMode}-${job._id ?? id}`}
                source={job.description}
                className="bg-transparent! text-sm text-slate-800 dark:text-slate-200 **:text-slate-800 dark:**:text-slate-200"
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">No additional details yet.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1 rounded-xl border border-white/70 bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
          <NotesPanel jobId={job._id ?? id} defaultOpen />

          <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-white/10">
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Activity</h3>
            <div className="space-y-2">
              {timelineItems.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No activity yet.</p>
              ) : timelineItems.map(item => (
                <div key={item.id} className="rounded-lg border border-slate-200/80 p-2 dark:border-white/10">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.label} · {formatDate(Number.isFinite(item.timestamp) ? new Date(item.timestamp).toISOString() : undefined)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editModalOpen && (
        <JobModal
          job={job}
          companies={companies}
          onSubmit={handleJobModalSubmit}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {isEditingDescription && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 md:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditingDescription(false)
              setDescriptionError(null)
            }
          }}
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col rounded-2xl border border-white/70 bg-white/85 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Edit Description</h2>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditingDescription(false)
                    setDescriptionError(null)
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-md border-slate-300/90 bg-white/80 px-2.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveDescription}
                  disabled={updateJobMutation.isPending}
                  variant="glassPrimary"
                  size="sm"
                  className="px-2.5 text-xs"
                >
                  {updateJobMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-hidden" data-color-mode={markdownColorMode}>
              <MDEditor
                key={`editor-modal-${markdownColorMode}`}
                value={descriptionDraft}
                onChange={(value) => setDescriptionDraft(value ?? '')}
                height={Math.max(420, (typeof window !== 'undefined' ? window.innerHeight - 220 : 600))}
                preview="live"
                visibleDragbar={false}
              />
              {descriptionError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{descriptionError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
