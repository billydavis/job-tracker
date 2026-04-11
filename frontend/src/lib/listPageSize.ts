import { DEFAULT_PAGE_SIZE } from '../api/client'

export const LIST_PAGE_SIZE_OPTIONS = [10, 25, 50] as const
export type ListPageSize = (typeof LIST_PAGE_SIZE_OPTIONS)[number]

const STORAGE_KEY = 'job-tracker-listPageSize'

function isAllowed(n: number): n is ListPageSize {
  return (LIST_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
}

export function getListPageSize(): number {
  if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const n = raw ? Number.parseInt(raw, 10) : Number.NaN
    if (isAllowed(n)) return n
  } catch {
    /* ignore */
  }
  return DEFAULT_PAGE_SIZE
}

export function setListPageSize(n: number): void {
  if (!isAllowed(n)) return
  try {
    localStorage.setItem(STORAGE_KEY, String(n))
  } catch {
    /* ignore */
  }
}
