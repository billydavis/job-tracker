import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCompany, deleteCompany, getCompanies, updateCompany } from '../api/client'
import type { Company } from '../types'

export const companiesQueryKey = ['companies'] as const

export function useCompaniesQuery() {
  return useQuery<Company[]>({
    queryKey: companiesQueryKey,
    queryFn: getCompanies,
    select: (data) => data ?? [],
  })
}

export function useCreateCompanyMutation() {
  const queryClient = useQueryClient()
  return useMutation<Company, Error, Pick<Company, 'name' | 'website' | 'description'>>({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKey })
    },
  })
}

export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient()
  return useMutation<Company, Error, { id: string; payload: Partial<Company> }>({
    mutationFn: ({ id, payload }) => updateCompany(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKey })
    },
  })
}

export function useDeleteCompanyMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKey })
    },
  })
}
