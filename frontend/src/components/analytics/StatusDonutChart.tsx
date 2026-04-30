import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { JobStats } from '../../types'
import { useChartColors } from '../../hooks/useChartColors'
import AnalyticsCard from './AnalyticsCard'

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  negotiation: 'Negotiation',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
}

const STATUS_COLORS: Record<string, string> = {
  waiting: '#9ca3af',
  applied: '#3b82f6',
  interview: '#7c3aed',
  offer: '#16a34a',
  negotiation: '#d97706',
  rejected: '#dc2626',
  ghosted: '#71717a',
}

interface Props {
  data: JobStats['statusCounts'] | undefined
  isLoading: boolean
}

function CustomTooltip({ active, payload, colors }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  return (
    <div style={{
      backgroundColor: colors.cardBackground,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '8px',
      padding: '8px 12px',
      color: colors.foreground,
      fontSize: '13px',
    }}>
      <p style={{ marginBottom: '2px', fontWeight: 500 }}>{row.name}</p>
      <p>{row.value} {row.value === 1 ? 'application' : 'applications'}</p>
    </div>
  )
}

export default function StatusDonutChart({ data, isLoading }: Props) {
  const colors = useChartColors()
  const chartData = (data ?? [])
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status] ?? item.status,
      value: item.count,
      status: item.status,
    }))
  const total = chartData.reduce((sum, row) => sum + row.value, 0)

  return (
    <AnalyticsCard
      title="Status Breakdown"
      className="h-full"
      titleRight={<p className="text-xs text-gray-500 dark:text-gray-400">{total} total</p>}
    >
      {isLoading ? (
        <div className="h-72 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          No data yet
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_150px] gap-3 items-center">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <CustomTooltip {...props} colors={colors} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-1.5">
            {chartData.map((row) => (
              <li key={row.status} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[row.status] ?? '#9ca3af' }}
                    aria-hidden="true"
                  />
                  {row.name}
                </span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-white">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AnalyticsCard>
  )
}
