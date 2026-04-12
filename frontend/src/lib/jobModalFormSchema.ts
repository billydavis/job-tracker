import { z } from 'zod'
import { hasMoneyDigits, parseOptionalNonneg } from './jobFormPayload'

export const NEW_COMPANY_SENTINEL = '__new__' as const

const JOB_STATUSES = [
  'waiting',
  'applied',
  'interview',
  'offer',
  'negotiation',
  'rejected',
  'ghosted',
] as const

const JOB_LOCATIONS = ['on-site', 'remote', 'hybrid'] as const

const TITLE_MAX = 200
const DESCRIPTION_MAX = 8000
const CONTACT_MAX = 2000

/** Fields we attach inline error messages to (includes combobox-related keys). */
export type JobModalFieldKey =
  | 'title'
  | 'companyId'
  | 'newCompanyName'
  | 'dateApplied'
  | 'salaryLowEnd'
  | 'salaryHighEnd'
  | 'url'
  | 'contact'
  | 'description'

export type JobModalFieldErrors = Partial<Record<JobModalFieldKey, string>>

const jobModalSubmitBaseSchema = z.object({
  title: z.string(),
  companyId: z.string(),
  status: z.enum(JOB_STATUSES),
  location: z.union([z.literal(''), z.enum(JOB_LOCATIONS)]),
  salaryLowEnd: z.string(),
  salaryHighEnd: z.string(),
  salaryPeriod: z.enum(['yearly', 'hourly']),
  url: z.string(),
  dateApplied: z.string(),
  description: z.string(),
  contact: z.string(),
  newCompanyName: z.string(),
})

export const jobModalSubmitSchema = jobModalSubmitBaseSchema.superRefine((data, ctx) => {
  const title = data.title.trim()
  if (!title) {
    ctx.addIssue({ code: 'custom', message: 'Job title is required', path: ['title'] })
  } else if (title.length > TITLE_MAX) {
    ctx.addIssue({
      code: 'custom',
      message: `Title must be at most ${TITLE_MAX} characters`,
      path: ['title'],
    })
  }

  if (!data.companyId) {
    ctx.addIssue({
      code: 'custom',
      message: 'Please select or create a company',
      path: ['companyId'],
    })
  } else if (data.companyId === NEW_COMPANY_SENTINEL) {
    if (!data.newCompanyName.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please enter a company name',
        path: ['newCompanyName'],
      })
    }
  }

  const dateStr = data.dateApplied.trim()
  if (dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || Number.isNaN(Date.parse(`${dateStr}T12:00:00`))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid date',
        path: ['dateApplied'],
      })
    }
  }

  const urlStr = data.url.trim()
  if (urlStr) {
    try {
      const u = new URL(urlStr)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        ctx.addIssue({
          code: 'custom',
          message: 'URL must start with http:// or https://',
          path: ['url'],
        })
      }
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid URL', path: ['url'] })
    }
  }

  const desc = data.description
  if (desc.length > DESCRIPTION_MAX) {
    ctx.addIssue({
      code: 'custom',
      message: `Description must be at most ${DESCRIPTION_MAX} characters`,
      path: ['description'],
    })
  }

  const contact = data.contact
  if (contact.length > CONTACT_MAX) {
    ctx.addIssue({
      code: 'custom',
      message: `Contact must be at most ${CONTACT_MAX} characters`,
      path: ['contact'],
    })
  }

  const hadLow = hasMoneyDigits(data.salaryLowEnd)
  const hadHigh = hasMoneyDigits(data.salaryHighEnd)
  if (hadLow || hadHigh) {
    const low = parseOptionalNonneg(data.salaryLowEnd)
    const high = parseOptionalNonneg(data.salaryHighEnd)
    if (hadLow && low === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid number for salary low end',
        path: ['salaryLowEnd'],
      })
    }
    if (hadHigh && high === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid number for salary high end',
        path: ['salaryHighEnd'],
      })
    }
    if (low != null && high != null && low > high) {
      ctx.addIssue({
        code: 'custom',
        message: 'High end must be greater than or equal to low end',
        path: ['salaryHighEnd'],
      })
    }
  }
})

export function jobModalFieldErrorsFromZod(error: z.ZodError): JobModalFieldErrors {
  const { fieldErrors } = error.flatten()
  const out: JobModalFieldErrors = {}
  const keys: JobModalFieldKey[] = [
    'title',
    'companyId',
    'newCompanyName',
    'dateApplied',
    'salaryLowEnd',
    'salaryHighEnd',
    'url',
    'contact',
    'description',
  ]
  for (const key of keys) {
    const msgs = fieldErrors[key as keyof typeof fieldErrors] as string[] | undefined
    if (msgs?.[0]) out[key] = msgs[0]
  }
  return out
}
