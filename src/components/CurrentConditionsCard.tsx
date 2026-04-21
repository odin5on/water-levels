import type { LatestReading } from '../api/types'
import { ProvisionalBadge } from './ProvisionalBadge'
import { formatDischarge, formatGageHeight } from '../utils/format'
import { formatTimestamp, ageMinutes } from '../utils/date'

interface Props {
  reading: LatestReading | null | undefined
  isLoading: boolean
  error: Error | null
}

export function CurrentConditionsCard({ reading, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 text-sm">
        Failed to load current conditions.
      </div>
    )
  }

  if (!reading) return null

  const dischargeAge = ageMinutes(reading.dischargeTime)
  const stale = dischargeAge !== null && dischargeAge > 90

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Current Conditions</h2>
        {stale && (
          <span className="text-xs text-gray-400">Data may be delayed</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Metric
          label="Streamflow"
          value={formatDischarge(reading.discharge)}
          time={reading.dischargeTime}
          provisional={reading.dischargeProvisional}
        />
        <Metric
          label="Gage Height"
          value={formatGageHeight(reading.gageHeight)}
          time={reading.gageHeightTime}
          provisional={reading.gageHeightProvisional}
        />
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  time,
  provisional,
}: {
  label: string
  value: string
  time: string | null
  provisional: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {provisional && <ProvisionalBadge />}
        {time && (
          <span className="text-xs text-gray-400">{formatTimestamp(time)}</span>
        )}
      </div>
    </div>
  )
}
