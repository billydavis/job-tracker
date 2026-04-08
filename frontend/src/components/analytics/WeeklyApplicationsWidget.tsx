import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { JobStats } from '../../types'

interface Props {
  data: JobStats['weeklyApplied'] | undefined
  isLoading: boolean
  weekOffset: number
  onWeekChange: (offset: number) => void
}

function formatWeekRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  const fmtYear = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${fmt.format(s)} – ${sameYear ? fmt.format(e) : fmtYear.format(e)}, ${s.getFullYear()}`
}

function deltaLabel(count: number, prev: number): { text: string; className: string } {
  const diff = count - prev
  if (diff === 0) return { text: 'Same as prior week', className: 'text-gray-500 dark:text-gray-400' }
  if (diff > 0) return { text: `+${diff} vs prior week`, className: 'text-green-600 dark:text-green-400' }
  return { text: `${diff} vs prior week`, className: 'text-red-600 dark:text-red-400' }
}

export default function WeeklyApplicationsWidget({ data, isLoading, weekOffset, onWeekChange }: Props) {
  const delta = data ? deltaLabel(data.count, data.previousCount) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base text-gray-900 dark:text-white">Weekly Applications</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onWeekChange(weekOffset - 1)}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {weekOffset < 0 && (
            <button
              onClick={() => onWeekChange(0)}
              className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              This week
            </button>
          )}
          <button
            onClick={() => onWeekChange(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-12 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ) : data ? (
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatWeekRange(data.weekStart, data.weekEnd)}
          </p>
          <p className="text-5xl font-bold text-gray-900 dark:text-white">
            {data.count}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">
              {data.count === 1 ? 'application' : 'applications'}
            </span>
          </p>
          {delta && (
            <p className={`text-sm font-medium ${delta.className}`}>{delta.text}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
            Prior week ({formatWeekRange(data.previousWeekStart, data.previousWeekEnd)}): {data.previousCount}
          </p>
        </div>
      ) : null}
    </div>
  )
}
