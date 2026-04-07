import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJob, deleteJob, getJob, getJobs, updateJob } from '../api/client'
import type { Job, JobFilters, PaginatedJobs } from '../types'

export const jobsQueryKey = ['jobs'] as const

function jobsQueryKeyWithFilters(filters: JobFilters) {
  return [...jobsQueryKey, filters] as const
}

export function useJobsQuery(filters: JobFilters) {
  return useQuery<PaginatedJobs>({
    queryKey: jobsQueryKeyWithFilters(filters),
    queryFn: () => getJobs(filters),
    placeholderData: keepPreviousData,
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
  return useMutation<Job, Error, Partial<Job>>({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    },
  })
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient()
  return useMutation<Job, Error, { id: string; payload: Partial<Job> }>({
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
