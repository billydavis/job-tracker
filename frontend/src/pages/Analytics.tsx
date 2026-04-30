import { useState } from 'react'
import { useJobStatsQuery } from '../hooks/useJobStats'
import StatusDistributionChart from '../components/analytics/StatusDistributionChart'
import LocationDistributionChart from '../components/analytics/LocationDistributionChart'
import WeeklyApplicationsWidget from '../components/analytics/WeeklyApplicationsWidget'
import RecentApplicationsWidget from '../components/analytics/RecentApplicationsWidget'
import PageHeader from '../components/layouts/PageHeader'

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
      <PageHeader
        title="Analytics"
        description="Review application status, location trends, and weekly momentum."
      />
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
