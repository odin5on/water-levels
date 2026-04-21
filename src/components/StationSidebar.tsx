import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { MonitoringLocationFeature } from '../api/types'
import type { LatestReading } from '../api/types'
import { formatDischarge, formatGageHeight, formatSiteId } from '../utils/format'
import { PERCENTILE_COLORS } from '../utils/percentile'
import type { PercentileClass } from '../api/types'

interface Props {
  sites: MonitoringLocationFeature[]
  readings: Map<string, LatestReading> | undefined
  percentiles: Map<string, PercentileClass>
  mapCenter: [number, number]
  onSiteHover: (siteId: string | null) => void
  selectedSiteId?: string | null
}

function distanceDeg(
  a: [number, number],
  b: [number, number],
): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}

export function StationSidebar({
  sites,
  readings,
  percentiles,
  mapCenter,
  onSiteHover,
  selectedSiteId,
}: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return sites
      .filter(
        (s) =>
          q === '' ||
          s.properties.monitoring_location_name.toLowerCase().includes(q) ||
          s.properties.monitoring_location_number.includes(q),
      )
      .sort(
        (a, b) =>
          distanceDeg(a.geometry.coordinates, mapCenter) -
          distanceDeg(b.geometry.coordinates, mapCenter),
      )
  }, [sites, query, mapCenter])

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <input
          type="search"
          placeholder="Search stations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-gray-400 mt-1 px-1">
          {filtered.length} station{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {filtered.map((site) => {
          const id = site.id
          const r = readings?.get(id)
          const cls = percentiles.get(id) ?? 'no-data'
          const color = PERCENTILE_COLORS[cls]
          const isSelected = selectedSiteId === id

          return (
            <Link
              key={id}
              to={`/station/${encodeURIComponent(id)}`}
              onMouseEnter={() => onSiteHover(id)}
              onMouseLeave={() => onSiteHover(null)}
              className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <span
                className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate leading-tight">
                  {site.properties.monitoring_location_name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatSiteId(id)}
                </div>
                {r && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r.discharge !== null && <span>{formatDischarge(r.discharge)}</span>}
                    {r.discharge !== null && r.gageHeight !== null && (
                      <span className="mx-1 text-gray-300">·</span>
                    )}
                    {r.gageHeight !== null && <span>{formatGageHeight(r.gageHeight)}</span>}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
