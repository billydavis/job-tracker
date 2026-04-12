import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJob, deleteJob, getJob, getJobs, updateJob } from '../api/client'
import type { Job, JobFilters, JobMutationPayload, PaginatedJobs } from '../types'

export const jobsQueryKey = ['jobs'] as const

function jobsQueryKeyWithFilters(filters: JobFilters) {
  return [...jobsQueryKey, filters] as const
}

function sameCompanyScope(prev: JobFilters | undefined, next: JobFilters): boolean {
  const a = prev?.companyId ?? ''
  const b = next.companyId ?? ''
  return a === b
}

export function useJobsQuery(filters: JobFilters, options?: { enabled?: boolean }) {
  return useQuery<PaginatedJobs>({
    queryKey: jobsQueryKeyWithFilters(filters),
    queryFn: () => getJobs(filters),
    // Do not reuse e.g. the main applications list as placeholder for a company-scoped query
    // (would show every company's jobs under one company header).
    placeholderData: (previousData, previousQuery) => {
      const prevFilters = previousQuery?.queryKey[1] as JobFilters | undefined
      if (!sameCompanyScope(prevFilters, filters)) return undefined
      return keepPreviousData(previousData)
    },
    enabled: options?.enabled ?? true,
  })
}

export function useJobQuery(id: string) {
  return useQuery<Job>({
    queryKey: [...jobsQueryKey, id],
    queryFn: () => getJob(id),
    enabled: Boolean(id),
  })
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient()
  return useMutation<Job, Error, JobMutationPayload>({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    },
  })
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient()
  return useMutation<Job, Error, { id: string; payload: JobMutationPayload }>({
    mutationFn: ({ id, payload }) => updateJob(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    },
  })
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    },
  })
}
