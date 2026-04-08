import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'
import type { JobStats } from '../../types'

const LOCATION_COLORS: Record<string, string> = {
  'on-site': '#3b82f6',
  remote: '#16a34a',
  hybrid: '#d97706',
}

const LOCATION_LABELS: Record<string, string> = {
  'on-site': 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

interface Props {
  data: JobStats['locationCounts'] | undefined
  isLoading: boolean
}

function CustomYTick({ x, y, payload, colors }: any) {
  return (
    <text x={x} y={y} fill={colors.mutedForeground} fontSize={12} textAnchor="end" dominantBaseline="middle">
      {payload.value}
    </text>
  )
}

function CustomXTick({ x, y, payload, colors }: any) {
  return (
    <text x={x} y={y} fill={colors.mutedForeground} fontSize={12} textAnchor="middle" dominantBaseline="hanging">
      {payload.value}
    </text>
  )
}

function CustomTooltip({ active, payload, label, colors }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: colors.cardBackground,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '8px',
      padding: '8px 12px',
      color: colors.foreground,
      fontSize: '13px',
    }}>
      <p style={{ marginBottom: '4px', fontWeight: 500 }}>{label}</p>
      <p>{payload[0].value} Jobs</p>
    </div>
  )
}

export default function LocationDistributionChart({ data, isLoading }: Props) {
  const colors = useChartColors()
  const chartData = (data ?? []).map(d => ({
    name: LOCATION_LABELS[d.location] ?? d.location,
    value: d.count,
    location: d.location,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="font-semibold text-base text-gray-900 dark:text-white mb-4">Applications by Location</h2>
      {isLoading ? (
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
            <XAxis
              type="number"
              allowDecimals={false}
              tick={(props) => <CustomXTick {...props} colors={colors} />}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              tick={(props) => <CustomYTick {...props} colors={colors} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: colors.cardBorder, opacity: 0.4 }}
              content={(props) => <CustomTooltip {...props} colors={colors} />}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map(entry => (
                <Cell
                  key={entry.location}
                  fill={LOCATION_COLORS[entry.location] ?? '#9ca3af'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
