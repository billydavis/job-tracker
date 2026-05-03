import {
  Cell,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { JobStats } from '../../types'
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

interface ChartDatum {
  name: string
  value: number
  status: string
}

interface TooltipPayloadRow {
  /** For RadialBar this is often the dataKey string (e.g. "value"), not the category label */
  name?: string
  value?: number
  payload?: ChartDatum
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadRow[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const point = row.payload
  const name = point?.name
  const value = point?.value ?? row.value
  if (name === undefined || value === undefined) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[13px] text-popover-foreground shadow-md">
      <p className="mb-0.5 font-medium">{name}</p>
      <p className="text-muted-foreground">
        {value} {value === 1 ? 'application' : 'applications'}
      </p>
    </div>
  )
}

export default function StatusPolarAreaChart({ data, isLoading }: Props) {
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
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="12%"
                outerRadius="92%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="category" dataKey="name" tick={false} axisLine={false} />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={false} axisLine={false} />
                <RadialBar
                  dataKey="value"
                  cornerRadius={4}
                  clockWise
                  background={{ fill: 'var(--muted)' }}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
                  ))}
                </RadialBar>
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
              </RadialBarChart>
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
