import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLatestReading } from '../hooks/useLatestReading'
import { useSparkline, useDaily } from '../hooks/useHistorical'
import type { TimeRange } from '../hooks/useHistorical'
import { CurrentConditionsCard } from '../components/CurrentConditionsCard'
import { SparklineChart } from '../components/Charts/SparklineChart'
import { HistoricalChart } from '../components/Charts/HistoricalChart'
import { formatSiteId } from '../utils/format'
import { getRiverSites } from '../api/usgs'
import { PARAM_DISCHARGE, PARAM_GAGE_HEIGHT, PARAM_LABELS, PARAM_UNITS } from '../api/parameters'
import type { DailyValue } from '../api/types'

type ParamTab = typeof PARAM_DISCHARGE | typeof PARAM_GAGE_HEIGHT

function downloadCSV(data: DailyValue[], filename: string, unit: string) {
  const rows = [
    ['date', `value_${unit}`],
    ...data.map((d) => [d.date, String(d.value)]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function StationPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const decodedId = decodeURIComponent(siteId ?? '')
  const [paramTab, setParamTab] = useState<ParamTab>(PARAM_DISCHARGE)
  const [range, setRange] = useState<TimeRange>('1yr')

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: getRiverSites,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const site = sites.find((s) => s.id === decodedId)

  const { data: reading, isLoading: readingLoading, error: readingError } = useLatestReading(decodedId)
  const { data: sparklineData = [], isLoading: sparklineLoading } = useSparkline(decodedId, paramTab)
  const { data: historicalData = [], isLoading: historicalLoading } = useDaily(decodedId, paramTab, range)

  const unit = PARAM_UNITS[paramTab]
  const label = PARAM_LABELS[paramTab]
  const numId = formatSiteId(decodedId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-3 py-1"
        >
          ← Back to Map
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                {site?.properties.monitoring_location_name ?? decodedId}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                <span>Site #{numId}</span>
                {site?.geometry && (
                  <span>
                    {site.geometry.coordinates[1].toFixed(4)}°N,{' '}
                    {Math.abs(site.geometry.coordinates[0]).toFixed(4)}°W
                  </span>
                )}
                {site?.properties.drainage_area != null && (
                  <span>Drainage area: {site.properties.drainage_area.toLocaleString()} mi²</span>
                )}
              </div>
            </div>
            <a
              href={`https://waterdata.usgs.gov/monitoring-location/${numId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            >
              USGS Page ↗
            </a>
          </div>
        </div>

        <div className="mb-4">
          <CurrentConditionsCard
            reading={reading}
            isLoading={readingLoading}
            error={readingError as Error | null}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">7-Day</h2>
            <div className="flex gap-1">
              {([PARAM_DISCHARGE, PARAM_GAGE_HEIGHT] as ParamTab[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setParamTab(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    paramTab === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {PARAM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          {sparklineLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <SparklineChart data={sparklineData} unit={unit} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <HistoricalChart
            data={historicalData}
            unit={unit}
            range={range}
            onRangeChange={setRange}
            isLoading={historicalLoading}
            paramLabel={label}
          />
          {historicalData.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() =>
                  downloadCSV(
                    historicalData,
                    `${numId}_${paramTab}_${range}.csv`,
                    unit,
                  )
                }
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
