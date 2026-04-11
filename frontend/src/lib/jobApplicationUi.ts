import type { JobStatus } from '../types'

export const ALL_STATUSES: JobStatus[] = [
  'waiting',
  'applied',
  'interview',
  'offer',
  'negotiation',
  'rejected',
  'ghosted',
]

export const STATUS_STYLES: Record<JobStatus, string> = {
  waiting: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  interview: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  negotiation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  ghosted: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

export function formatAppliedDate(dateApplied?: string) {
  if (!dateApplied) return 'Date applied not set'
  const timestamp = Date.parse(dateApplied)
  if (Number.isNaN(timestamp)) return 'Date applied not set'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp))
}
