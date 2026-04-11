import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompaniesSelect,
  getCompany,
  updateCompany,
} from '../api/client'
import type { Company, CompanyFilters, PaginatedCompanies } from '../types'

export const companiesQueryKey = ['companies'] as const

function companiesListQueryKey(filters: CompanyFilters) {
  return [...companiesQueryKey, 'list', filters] as const
}

/** Full company list for dropdowns (job modal, etc.). */
export function useCompaniesQuery() {
  return useQuery<Company[]>({
    queryKey: [...companiesQueryKey, 'select'],
    queryFn: getCompaniesSelect,
    select: (data) => data ?? [],
  })
}

/** Paginated company list (companies page). */
export function useCompaniesListQuery(filters: CompanyFilters) {
  return useQuery<PaginatedCompanies>({
    queryKey: companiesListQueryKey(filters),
    queryFn: () => getCompanies(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCompanyQuery(id: string) {
  return useQuery<Company>({
    queryKey: [...companiesQueryKey, id],
    queryFn: () => getCompany(id),
    enabled: Boolean(id),
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
