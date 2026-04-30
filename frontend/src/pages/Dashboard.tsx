import { useState, type ReactNode } from 'react'
import { BriefcaseBusiness, Building2, HandCoins, TrendingUp } from 'lucide-react'
import RecentApplicationsWidget from '../components/analytics/RecentApplicationsWidget'
import StatusDonutChart from '../components/analytics/StatusDonutChart'
import WeeklyApplicationsWidget from '../components/analytics/WeeklyApplicationsWidget'
import JobModal from '../components/JobModal'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useCompaniesQuery } from '../hooks/useCompanies'
import { useCreateJobMutation } from '../hooks/useJobs'
import { useCompaniesListQuery } from '../hooks/useCompanies'
import { useJobStatsQuery } from '../hooks/useJobStats'
import { jobFormToApiPayload } from '../lib/jobFormPayload'
import type { JobFormData } from '../types'

const ACTIVE_PIPELINE_STATUSES = new Set(['waiting', 'applied', 'interview', 'negotiation'])

interface KpiCardProps {
  title: string
  value: number
  subtitle: string
  icon: ReactNode
  isLoading: boolean
}

function KpiCard({ title, value, subtitle, icon, isLoading }: KpiCardProps) {
  return (
    <Card className="gap-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</CardTitle>
        <span className="text-gray-500 dark:text-gray-400" aria-hidden="true">{icon}</span>
      </CardHeader>
      <CardContent className="px-5 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-14 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const { data: overallData, isLoading: overallLoading, error } = useJobStatsQuery(0)
  const { data: weeklyData, isLoading: weeklyLoading } = useJobStatsQuery(weekOffset)
  const { data: companyOptions = [] } = useCompaniesQuery()
  const { data: companiesData, isLoading: companiesLoading } = useCompaniesListQuery({
    page: 1,
    limit: 1,
    search: '',
  })
  const createJobMutation = useCreateJobMutation()

  const totalApplications = (overallData?.statusCounts ?? []).reduce((sum, row) => sum + row.count, 0)
  const activePipeline = (overallData?.statusCounts ?? []).reduce(
    (sum, row) => sum + (ACTIVE_PIPELINE_STATUSES.has(row.status) ? row.count : 0),
    0,
  )
  const offers = (overallData?.statusCounts ?? []).find((row) => row.status === 'offer')?.count ?? 0
  const companies = companiesData?.total ?? 0

  async function handleCreateJob(form: JobFormData) {
    const payload = jobFormToApiPayload(form, { isEdit: false })
    await createJobMutation.mutateAsync(payload)
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm">
        Failed to load dashboard data.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track momentum and pipeline health across your job search.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
          >
            + Add application
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Applications"
          value={totalApplications}
          subtitle="Across all statuses"
          icon={<BriefcaseBusiness className="size-4" />}
          isLoading={overallLoading}
        />
        <KpiCard
          title="Active Pipeline"
          value={activePipeline}
          subtitle="Waiting, applied, interview, negotiation"
          icon={<TrendingUp className="size-4" />}
          isLoading={overallLoading}
        />
        <KpiCard
          title="Offers"
          value={offers}
          subtitle="Opportunities you can close"
          icon={<HandCoins className="size-4" />}
          isLoading={overallLoading}
        />
        <KpiCard
          title="Companies"
          value={companies}
          subtitle="Tracked in your workspace"
          icon={<Building2 className="size-4" />}
          isLoading={companiesLoading}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
        <div className="xl:col-span-2">
          <StatusDonutChart data={overallData?.statusCounts} isLoading={overallLoading} />
        </div>
        <div className="xl:col-span-3">
          <RecentApplicationsWidget data={overallData?.recentApplications} isLoading={overallLoading} />
        </div>
      </section>

      <section>
        <WeeklyApplicationsWidget
          data={weeklyData?.weeklyApplied}
          isLoading={weeklyLoading}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
        />
      </section>

      {modalOpen && (
        <JobModal
          companies={companyOptions}
          onSubmit={handleCreateJob}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
