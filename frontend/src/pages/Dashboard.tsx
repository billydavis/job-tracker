import { useState, type ReactNode } from 'react'
import { BriefcaseBusiness, Building2, HandCoins, TrendingUp } from 'lucide-react'
import RecentApplicationsWidget from '../components/analytics/RecentApplicationsWidget'
import StatusDonutChart from '../components/analytics/StatusDonutChart'
import WeeklyApplicationsWidget from '../components/analytics/WeeklyApplicationsWidget'
import JobModal from '../components/JobModal'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import PageHeader from '../components/layouts/PageHeader'
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
    <Card className="gap-3 border-white/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/55 backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)]">
      <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
        <span className="text-slate-500 dark:text-slate-400" aria-hidden="true">{icon}</span>
      </CardHeader>
      <CardContent className="px-5 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-14 bg-slate-200/70 dark:bg-slate-700/60 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-200/70 dark:bg-slate-700/60 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
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
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Dashboard Overview"
        description="Track momentum and pipeline health across your job search."
        actions={
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            variant="glassPrimary"
          >
            + Add application
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
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

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-4">
          <StatusDonutChart data={overallData?.statusCounts} isLoading={overallLoading} />
        </div>
        <div className="xl:col-span-8">
          <RecentApplicationsWidget data={overallData?.recentApplications} isLoading={overallLoading} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <WeeklyApplicationsWidget
            data={weeklyData?.weeklyApplied}
            isLoading={weeklyLoading}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
        </div>
        <Card className="xl:col-span-4 gap-3 border-white/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/55 backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)]">
          <CardHeader className="px-5 pb-0">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Pipeline Insights</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pt-0">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                Active applications
                <span className="font-semibold text-slate-900 dark:text-slate-100">{activePipeline}</span>
              </li>
              <li className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                Offer conversion
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {totalApplications > 0 ? `${Math.round((offers / totalApplications) * 100)}%` : '0%'}
                </span>
              </li>
              <li className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                Companies engaged
                <span className="font-semibold text-slate-900 dark:text-slate-100">{companies}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Keep this panel for quick desktop scanning while reviewing weekly trends.
            </p>
          </CardContent>
        </Card>
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
