import { useState } from 'react'
import { useJobStatsQuery } from '../hooks/useJobStats'
import StatusDistributionChart from '../components/analytics/StatusDistributionChart'
import LocationDistributionChart from '../components/analytics/LocationDistributionChart'
import WeeklyApplicationsWidget from '../components/analytics/WeeklyApplicationsWidget'
import RecentApplicationsWidget from '../components/analytics/RecentApplicationsWidget'

export default function Analytics() {
  const [weekOffset, setWeekOffset] = useState(0)
  const { data: overallData, isLoading: overallLoading, error } = useJobStatsQuery(0)
  const { data: weeklyData, isLoading: weeklyLoading } = useJobStatsQuery(weekOffset)

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm">
        Failed to load analytics data.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/65 dark:bg-slate-900/50 backdrop-blur-md px-5 py-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.6)]">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Review application status, location trends, and weekly momentum.
        </p>
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <RecentApplicationsWidget data={overallData?.recentApplications} isLoading={overallLoading} />
        </div>
        <div className="xl:col-span-4">
          <StatusDistributionChart data={overallData?.statusCounts} isLoading={overallLoading} />
        </div>
        <div className="xl:col-span-5">
          <LocationDistributionChart data={overallData?.locationCounts} isLoading={overallLoading} />
        </div>
        <div className="xl:col-span-7">
          <WeeklyApplicationsWidget
            data={weeklyData?.weeklyApplied}
            isLoading={weeklyLoading}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
        </div>
      </div>
    </div>
  )
}
