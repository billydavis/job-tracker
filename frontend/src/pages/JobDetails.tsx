import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { useCompaniesQuery } from '../hooks/useCompanies'
import { useJobQuery, useJobsQuery, useUpdateJobMutation } from '../hooks/useJobs'
import { useNotesQuery } from '../hooks/useNotes'
import NotesPanel from '../components/NotesPanel'
import type { JobStatus } from '../types'

const STATUS_STYLES: Record<JobStatus, string> = {
  waiting: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
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
    year: 'numeric', month: 'short', day: 'numeric',
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

export default function JobDetails() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''

  const { data: job, isLoading, error } = useJobQuery(id)
  const { data: jobs = [] } = useJobsQuery()
  const { data: companies = [] } = useCompaniesQuery()
  const { data: notes = [] } = useNotesQuery(id)
  const updateJobMutation = useUpdateJobMutation()

  const [markdownColorMode, setMarkdownColorMode] = useState<'light' | 'dark'>('light')

  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [descriptionError, setDescriptionError] = useState<string | null>(null)

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
    return [...jobs].sort((left, right) => toTimestamp(right.dateApplied) - toTimestamp(left.dateApplied))
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
    return <div className="text-gray-400 dark:text-gray-500">Loading job…</div>
  }

  if (error || !job) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load this job.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mb-3 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
            {job.companyId ? (
              <Link
                to={`/companies/${job.companyId}`}
                className="text-sm text-gray-500 dark:text-gray-400 mt-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {companyName}
              </Link>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{companyName}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status]}`}>
              {job.status}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => previousJob && navigate(`/jobs/${previousJob._id}`)}
                disabled={!previousJob}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => nextJob && navigate(`/jobs/${nextJob._id}`)}
                disabled={!nextJob}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Applied</p>
            <p className="text-gray-900 dark:text-white mt-0.5">{formatDate(job.dateApplied)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
            <p className="text-gray-900 dark:text-white mt-0.5">{job.location ?? 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Salary</p>
            <p className="text-gray-900 dark:text-white mt-0.5">{job.salary ? `$${job.salary.toLocaleString()}` : 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
            <p className="text-gray-900 dark:text-white mt-0.5">{job.contact ?? 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Posting</p>
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
              <p className="text-gray-900 dark:text-white mt-0.5">Not set</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">Description</h2>
            <button
              onClick={beginDescriptionEdit}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>

          <div className="min-h-40" data-color-mode={markdownColorMode}>
            {job.description ? (
              <MDEditor.Markdown
                key={`markdown-${markdownColorMode}-${job._id ?? id}`}
                source={job.description}
                className="bg-transparent! text-sm text-slate-800 dark:text-slate-200 **:text-slate-800 dark:**:text-slate-200"
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">No additional details yet.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h2>
          <NotesPanel jobId={job._id ?? id} defaultOpen />

          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Activity</h3>
            <div className="space-y-2">
              {timelineItems.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No activity yet.</p>
              ) : timelineItems.map(item => (
                <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.label} · {formatDate(Number.isFinite(item.timestamp) ? new Date(item.timestamp).toISOString() : undefined)}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
          <div className="mx-auto h-full max-w-6xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Edit Description</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditingDescription(false)
                    setDescriptionError(null)
                  }}
                  className="text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDescription}
                  disabled={updateJobMutation.isPending}
                  className="text-xs px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
                >
                  {updateJobMutation.isPending ? 'Saving…' : 'Save'}
                </button>
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
