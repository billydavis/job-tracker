import type { Job } from '../types'

function fmtMoney(n: number, period: 'yearly' | 'hourly') {
  if (period === 'hourly') {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/** Compact label for lists and chips; null if no compensation data. */
export function formatJobSalary(job: Job): string | null {
  if (job.salaryRange) {
    const { lowEnd, highEnd, period } = job.salaryRange
    const unit = period === 'hourly' ? '/hr' : '/yr'
    if (lowEnd != null && highEnd != null && lowEnd !== highEnd) {
      return `$${fmtMoney(lowEnd, period)}–$${fmtMoney(highEnd, period)}${unit}`
    }
    const v = lowEnd ?? highEnd
    if (v != null) return `$${fmtMoney(v, period)}${unit}`
    return null
  }
  if (job.salary != null) return `$${job.salary.toLocaleString()}/yr`
  return null
}
