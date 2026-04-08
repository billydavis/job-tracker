import { Treemap, Tooltip, ResponsiveContainer } from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'
import type { JobStats } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  waiting: '#9ca3af',
  applied: '#3b82f6',
  interview: '#7c3aed',
  offer: '#16a34a',
  negotiation: '#d97706',
  rejected: '#dc2626',
  ghosted: '#71717a',
}

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  negotiation: 'Negotiation',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
}

interface Props {
  data: JobStats['statusCounts'] | undefined
  isLoading: boolean
}

function StatusCell({ x, y, width, height, name, value, status }: any) {
  const tooSmall = width < 40 || height < 30
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={STATUS_COLORS[status] ?? '#9ca3af'}
        rx={4}
      />
      {!tooSmall && (
        <>
          <text
            x={x + width / 2} y={y + height / 2 - 8}
            textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize={12} fontWeight={500}
            style={{ pointerEvents: 'none' }}
          >
            {name}
          </text>
          <text
            x={x + width / 2} y={y + height / 2 + 8}
            textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.75)" fontSize={11}
            style={{ pointerEvents: 'none' }}
          >
            {value}
          </text>
        </>
      )}
    </g>
  )
}

function CustomTooltip({ active, payload, colors }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0].payload
  return (
    <div style={{
      backgroundColor: colors.cardBackground,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '8px',
      padding: '8px 12px',
      color: colors.foreground,
      fontSize: '13px',
    }}>
      <p style={{ fontWeight: 500, marginBottom: '2px' }}>{name}</p>
      <p>{value} {value === 1 ? 'job' : 'jobs'}</p>
    </div>
  )
}

export default function StatusDistributionChart({ data, isLoading }: Props) {
  const colors = useChartColors()
  const chartData = (data ?? [])
    .filter(d => d.count > 0)
    .map(d => ({ name: STATUS_LABELS[d.status] ?? d.status, value: d.count, status: d.status }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="font-semibold text-base text-gray-900 dark:text-white mb-4">Applications by Status</h2>
      {isLoading ? (
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <Treemap
            data={chartData}
            dataKey="value"
            content={<StatusCell />}
          >
            <Tooltip content={(props) => <CustomTooltip {...props} colors={colors} />} />
          </Treemap>
        </ResponsiveContainer>
      )}
    </div>
  )
}
