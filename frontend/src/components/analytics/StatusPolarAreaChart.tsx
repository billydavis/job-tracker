import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
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

/** Inner hole and outer cap as % of chart radius (matches prior donut-ish proportions). */
const INNER_PCT = 14
const OUTER_PCT = 88
const RADIUS_LO = 16
const RADIUS_HI = 88

interface Props {
  data: JobStats['statusCounts'] | undefined
  isLoading: boolean
}

interface ChartDatum {
  name: string
  /** Drives slice angle; equal for all rows so each status gets the same arc width. */
  sliceUnit: number
  count: number
  status: string
}

interface TooltipPayloadRow {
  name?: string
  value?: number
  payload?: ChartDatum
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadRow[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const point = row.payload
  const name = point?.name ?? row.name
  const value = point?.count ?? row.value
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
  const chartData: ChartDatum[] = (data ?? [])
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status] ?? item.status,
      sliceUnit: 1,
      count: item.count,
      status: item.status,
    }))
  const total = chartData.reduce((sum, row) => sum + row.count, 0)
  const radiusMax = Math.max(...chartData.map((d) => d.count), 1)

  const outerRadiusForCount = (count: number) => {
    const t = radiusMax > 0 ? count / radiusMax : 0
    const pct = RADIUS_LO + t * (RADIUS_HI - RADIUS_LO)
    return `${pct}%`
  }

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
                {/* Full-length muted wedges behind (polar “track”) */}
                <Pie
                  data={chartData}
                  dataKey="sliceUnit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={`${INNER_PCT}%`}
                  outerRadius={`${OUTER_PCT}%`}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="none"
                  fill="var(--muted)"
                  isAnimationActive={false}
                />
                <Pie
                  data={chartData}
                  dataKey="sliceUnit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={`${INNER_PCT}%`}
                  outerRadius={(d: ChartDatum) => outerRadiusForCount(d.count)}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
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
                <span className="font-medium tabular-nums text-gray-900 dark:text-white">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AnalyticsCard>
  )
}
