import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJob, deleteJob, getJobs, updateJob } from '../api/client'
import type { Job } from '../types'

export const jobsQueryKey = ['jobs'] as const

export function useJobsQuery() {
  return useQuery<Job[]>({
    queryKey: jobsQueryKey,
    queryFn: getJobs,
    select: (data) => data ?? [],
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
