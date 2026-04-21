import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { DailyValue } from '../../api/types'
import { formatTimestamp } from '../../utils/date'

interface Props {
  data: DailyValue[]
  unit: string
  color?: string
}

export function SparklineChart({ data, unit, color = '#3b82f6' }: Props) {
  if (data.length === 0) {
    return <div className="h-24 flex items-center justify-center text-sm text-gray-400">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={96}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const { date, value } = payload[0].payload as DailyValue
            return (
              <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                <div className="text-gray-500">{formatTimestamp(date)}</div>
                <div className="font-semibold">
                  {Number(value).toLocaleString()} {unit}
                </div>
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
