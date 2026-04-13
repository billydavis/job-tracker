import type { JobLocation, JobStatus } from '../types'

const LOCATION_KEYS = ['on-site', 'remote', 'hybrid'] as const satisfies readonly JobLocation[]

/** Outlined pill styles for the job list (border + text + light tint). */
export const LOCATION_LIST_BADGE_STYLES: Record<JobLocation, string> = {
  'on-site':
    'border-sky-500 text-sky-950 bg-sky-100 dark:border-sky-600 dark:text-sky-300 dark:bg-sky-950/40',
  remote:
    'border-emerald-600 text-emerald-950 bg-emerald-100 dark:border-emerald-600 dark:text-emerald-300 dark:bg-emerald-950/40',
  hybrid:
    'border-violet-600 text-violet-950 bg-violet-100 dark:border-violet-600 dark:text-violet-300 dark:bg-violet-950/40',
}

const LOCATION_LIST_BADGE_FALLBACK =
  'border-gray-400 text-gray-800 bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:bg-transparent'

const LOCATION_LIST_BADGE_BASE = 'text-xs rounded px-1.5 py-0.5 border shrink-0'

export function locationListBadgeClassName(location: string | undefined): string {
  if (!location) return LOCATION_LIST_BADGE_BASE
  const variant = (LOCATION_KEYS as readonly string[]).includes(location)
    ? LOCATION_LIST_BADGE_STYLES[location as JobLocation]
    : LOCATION_LIST_BADGE_FALLBACK
  return `${LOCATION_LIST_BADGE_BASE} ${variant}`
}

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
