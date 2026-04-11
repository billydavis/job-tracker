import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useCompaniesQuery } from '../hooks/useCompanies'

export default function Companies() {
  const [search, setSearch] = useState('')
  const { data: companies = [], isLoading: loading, error } = useCompaniesQuery()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = companies
    if (q) {
      list = companies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.website && c.website.toLowerCase().includes(q)),
      )
    }
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    )
  }, [companies, search])

  const errObj = error as { error?: string; message?: string } | null
  const errorMessage =
    errObj?.error ?? errObj?.message ?? 'Failed to load companies'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Companies</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or website…"
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-52"
        />
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

      {loading && (
        <div className="text-gray-400 dark:text-gray-500">Loading…</div>
      )}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 mb-4">
          {errorMessage}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-gray-500 dark:text-gray-400">
                {companies.length === 0 && !search
                  ? 'No companies yet'
                  : 'No companies match your search'}
              </p>
              {companies.length === 0 && !search && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Add a company when you create or edit an application.
                </p>
              )}
            </div>
          ) : (
            filtered.map((c) => (
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
      )}
    </div>
  )
}
