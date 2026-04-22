import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { DailyValue } from '../../api/types'
import { formatDate } from '../../utils/date'
import type { TimeRange } from '../../hooks/useHistorical'

interface Props {
  data: DailyValue[]
  unit: string
  range: TimeRange
  onRangeChange: (r: TimeRange) => void
  isLoading: boolean
  paramLabel: string
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '30d', value: '30d' },
  { label: '1yr', value: '1yr' },
  { label: '5yr', value: '5yr' },
  { label: 'Max', value: 'max' },
]

export function HistoricalChart({ data, unit, range, onRangeChange, isLoading, paramLabel }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">{paramLabel} — Daily Mean</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                range === r.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No data available for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => {
                const d = new Date(v + 'T12:00:00')
                return range === '30d'
                  ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }}
              tick={{ fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 10000 ? `${(v / 1000).toFixed(0)}k` : v.toLocaleString()
              }
              tick={{ fontSize: 11 }}
              width={48}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const { date, value } = payload[0].payload as DailyValue
                return (
                  <div className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs shadow">
                    <div className="text-gray-500 mb-0.5">{formatDate(date)}</div>
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
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
