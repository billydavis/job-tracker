import { useQuery } from '@tanstack/react-query'
import { getJobStats } from '../api/client'
import type { JobStats } from '../types'

export function useJobStatsQuery(weekOffset: number) {
  return useQuery<JobStats>({
    queryKey: ['jobStats', weekOffset],
    queryFn: () => getJobStats(weekOffset),
    staleTime: 60_000,
  })
}
