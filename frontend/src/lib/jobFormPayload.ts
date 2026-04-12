import type { JobFormData, JobMutationPayload, JobSalaryRange } from '../types'

/** Local calendar date as YYYY-MM-DD for `<input type="date">`. */
export function formatLocalDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Strip common formatting so "75,000" / "$80k" style input parses (thousands separators, currency, spaces). */
export function normalizeMoneyDigits(raw: string): string {
  return raw.trim().replace(/[$€£\s,\u00A0]/g, '')
}

export function hasMoneyDigits(raw: string): boolean {
  return normalizeMoneyDigits(raw) !== ''
}

/** Parsed non-negative number, or undefined if empty/invalid. */
export function parseOptionalNonneg(raw: string): number | undefined {
  const t = normalizeMoneyDigits(raw)
  if (t === '') return undefined
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

/** Build API payload fields from the job modal form (excluding company create resolution). */
export function jobFormToApiPayload(
  form: JobFormData,
  options: { isEdit: boolean },
): JobMutationPayload {
  const lowEnd = parseOptionalNonneg(form.salaryLowEnd)
  const highEnd = parseOptionalNonneg(form.salaryHighEnd)
  const hadLowInput = hasMoneyDigits(form.salaryLowEnd)
  const hadHighInput = hasMoneyDigits(form.salaryHighEnd)
  const anySalaryInput = hadLowInput || hadHighInput

  let salaryRange: JobSalaryRange | null | undefined
  if (!anySalaryInput) {
    salaryRange = options.isEdit ? null : undefined
  } else {
    const range: JobSalaryRange = { period: form.salaryPeriod }
    if (lowEnd !== undefined) range.lowEnd = lowEnd
    if (highEnd !== undefined) range.highEnd = highEnd
    if (range.lowEnd === undefined && range.highEnd === undefined) {
      salaryRange = options.isEdit ? null : undefined
    } else {
      salaryRange = range
    }
  }

  const payload: JobMutationPayload = {
    title: form.title,
    companyId: form.companyId || undefined,
    status: form.status,
    location: form.location || undefined,
    url: form.url || undefined,
    dateApplied: form.dateApplied || undefined,
    description: form.description || undefined,
    contact: form.contact || undefined,
  }

  if (salaryRange !== undefined) {
    payload.salaryRange = salaryRange
  }

  return payload
}
