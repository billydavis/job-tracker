export interface User {
  _id?: string
  name: string
  email: string
  createdAt?: string
}

export type JobStatus =
  | 'waiting'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'negotiation'
  | 'rejected'
  | 'ghosted'

export type JobLocation = 'on-site' | 'remote' | 'hybrid'

export type JobSalaryPeriod = 'yearly' | 'hourly'

export interface JobSalaryRange {
  lowEnd?: number
  highEnd?: number
  period: JobSalaryPeriod
}

/** Shape of the add/edit job modal (string fields match controlled inputs). */
export interface JobFormData {
  title: string
  companyId: string
  status: JobStatus
  location: JobLocation | ''
  salaryLowEnd: string
  salaryHighEnd: string
  salaryPeriod: JobSalaryPeriod
  url: string
  dateApplied: string
  description: string
  contact: string
}

export interface Job {
  _id?: string
  userId: string
  companyId?: string
  title: string
  description?: string
  contact?: string
  location?: JobLocation
  /** Legacy; prefer salaryRange. */
  salary?: number
  salaryRange?: JobSalaryRange
  url?: string
  status: JobStatus
  dateApplied?: string
  createdAt?: string
  updatedAt?: string
}

/** Create/update request body; `salaryRange: null` clears compensation on update. */
export type JobMutationPayload = Partial<Job> & { salaryRange?: JobSalaryRange | null }

export interface Company {
  _id?: string
  userId?: string
  name: string
  website?: string
  description?: string
  createdAt?: string
  /** Present on list responses when scoped to a user (auth). */
  jobCount?: number
}

export interface Note {
  _id?: string
  jobId: string
  content: string
  createdAt?: string
  updatedAt?: string
}

export interface JobFilters {
  page: number
  limit: number
  search: string
  status: string
  /** When set, list is scoped to this company (server-side). */
  companyId?: string
}

export interface PaginatedJobs {
  data: Job[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CompanyFilters {
  page: number
  limit: number
  search: string
}

export interface PaginatedCompanies {
  data: Company[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  status: number
  message: string
  error?: string
  [key: string]: unknown
}

export interface JobStats {
  statusCounts: Array<{ status: string; count: number }>
  locationCounts: Array<{ location: string; count: number }>
  weeklyApplied: {
    weekOffset: number
    weekStart: string
    weekEnd: string
    count: number
    previousCount: number
    previousWeekStart: string
    previousWeekEnd: string
  }
  recentApplications: Array<{
    jobId: string
    title: string
    companyName: string | null
    dateApplied: string
    status: string
  }>
}
