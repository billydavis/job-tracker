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

export interface Job {
  _id?: string
  userId: string
  companyId?: string
  title: string
  description?: string
  contact?: string
  location?: JobLocation
  salary?: number
  url?: string
  status: JobStatus
  dateApplied?: string
  createdAt?: string
  updatedAt?: string
}

export interface Company {
  _id?: string
  userId?: string
  name: string
  website?: string
  description?: string
  createdAt?: string
}

export interface Note {
  _id?: string
  jobId: string
  content: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiError {
  status: number
  message: string
  error?: string
  [key: string]: unknown
}
