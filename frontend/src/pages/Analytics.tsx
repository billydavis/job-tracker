import { useState } from 'react'
import { useJobStatsQuery } from '../hooks/useJobStats'
import StatusDistributionChart from '../components/analytics/StatusDistributionChart'
import LocationDistributionChart from '../components/analytics/LocationDistributionChart'
import WeeklyApplicationsWidget from '../components/analytics/WeeklyApplicationsWidget'
import RecentApplicationsWidget from '../components/analytics/RecentApplicationsWidget'

export default function Analytics() {
  const [weekOffset, setWeekOffset] = useState(0)
  const { data, isLoading, error } = useJobStatsQuery(weekOffset)

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm">
        Failed to load analytics data.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentApplicationsWidget data={data?.recentApplications} isLoading={isLoading} />
        <StatusDistributionChart data={data?.statusCounts} isLoading={isLoading} />
        <LocationDistributionChart data={data?.locationCounts} isLoading={isLoading} />
        <WeeklyApplicationsWidget
          data={data?.weeklyApplied}
          isLoading={isLoading}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
        />
      </div>
    </div>
  )
}
