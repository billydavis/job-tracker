import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Search } from 'lucide-react'
import ListPaginationBar from '../components/ListPaginationBar'
import { useCompaniesListQuery } from '../hooks/useCompanies'
import { getListPageSize, setListPageSize } from '../lib/listPageSize'
import type { CompanyFilters } from '../types'

export default function Companies() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(() => getListPageSize())

  useEffect(() => {
    setPage(1)
  }, [search])

  const filters: CompanyFilters = { page, limit, search }
  const { data, isLoading: loading, isFetching, error } = useCompaniesListQuery(filters)

  const companies = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const errObj = error as { error?: string; message?: string } | null
  const errorMessage =
    errObj?.error ?? errObj?.message ?? 'Failed to load companies'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Companies</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap gap-2 mb-4">
        <div className="relative min-w-52">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or website…"
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {loading && !data && (
        <div className="text-gray-400 dark:text-gray-500">Loading…</div>
      )}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4">
          {errorMessage}
        </div>
      )}

      {!loading && !error && (
        <div className={isFetching ? 'opacity-60 pointer-events-none' : ''}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {companies.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium text-gray-500 dark:text-gray-400">
                  {total === 0 && !search
                    ? 'No companies yet'
                    : 'No companies match your search'}
                </p>
                {total === 0 && !search && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Add a company when you create or edit an application.
                  </p>
                )}
              </div>
            ) : (
              companies.map((c) => (
                <div
                  key={c._id}
                  className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/companies/${c._id}`}
                      className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                    >
                      {c.name}
                    </Link>
                    {c.website ? (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-0.5 break-all"
                      >
                        <span className="truncate">{c.website}</span>
                        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        No website
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {c.jobCount === undefined
                        ? '—'
                        : `${c.jobCount} application${c.jobCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <ListPaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(n) => {
              setListPageSize(n)
              setLimit(n)
              setPage(1)
            }}
            disabled={isFetching}
          />
        </div>
      )}
    </div>
  )
}
