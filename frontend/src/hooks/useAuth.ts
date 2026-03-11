import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { login, logout, me, register } from '../api/client'
import type { User } from '../types'

export const meQueryKey = ['auth', 'me'] as const

export function useMeQuery() {
  return useQuery<User | null>({
    queryKey: meQueryKey,
    queryFn: async () => {
      try {
        return await me()
      } catch {
        return null
      }
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation<User, Error, { email: string; password: string }>({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryKey, user)
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation<User, Error, { name: string; email: string; password: string }>({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryKey, user)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(meQueryKey, null)
      queryClient.removeQueries({ queryKey: ['jobs'] })
    },
  })
}
