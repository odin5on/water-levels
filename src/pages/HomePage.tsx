import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSites } from '../hooks/useSites'
import { useLatestReadings } from '../hooks/useLatestReading'
import { useBatchPercentile } from '../hooks/useHistorical'
import { IowaMap } from '../components/Map/IowaMap'
import { StationSidebar } from '../components/StationSidebar'
import { computePercentile, percentileClass, PERCENTILE_COLORS, PERCENTILE_LABELS } from '../utils/percentile'
import type { PercentileClass } from '../api/types'
import { PARAM_DISCHARGE } from '../api/parameters'

const IOWA_CENTER: [number, number] = [-93.5, 42.0]

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined
  const initialLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined
  const initialZoom = searchParams.get('z') ? Number(searchParams.get('z')) : undefined

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLat && initialLng ? [initialLng, initialLat] : IOWA_CENTER,
  )
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null)
  const navigate = useNavigate()
  const handleSiteClick = useCallback(
    (siteId: string) => navigate(`/station/${encodeURIComponent(siteId)}`),
    [navigate],
  )

  const { data: sites = [], isLoading: sitesLoading, error: sitesError } = useSites()
  const siteIds = useMemo(() => sites.map((s) => s.id), [sites])

  const { data: readings } = useLatestReadings(siteIds)

  // Only fetch percentile history for sites that have current discharge readings
  const activeSiteIds = useMemo(
    () =>
      readings
        ? Array.from(readings.entries())
            .filter(([, r]) => r.discharge !== null)
            .map(([id]) => id)
        : [],
    [readings],
  )
  const { data: historicalBatch } = useBatchPercentile(activeSiteIds, PARAM_DISCHARGE)

  const percentiles = useMemo<Map<string, PercentileClass>>(() => {
    const map = new Map<string, PercentileClass>()
    for (const s of sites) {
      const id = s.id
      const reading = readings?.get(id)
      const history = historicalBatch?.get(id)
      if (reading?.discharge != null && history && history.length > 0) {
        const pct = computePercentile(reading.discharge, history)
        map.set(id, percentileClass(pct))
      } else {
        map.set(id, 'no-data')
      }
    }
    return map
  }, [sites, readings, historicalBatch])

  function handleMoveEnd(center: [number, number]) {
    setMapCenter(center)
    setSearchParams(
      { lat: center[1].toFixed(4), lng: center[0].toFixed(4), z: '7' },
      { replace: true },
    )
  }

  if (sitesError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load stations</p>
          <p className="text-gray-500 text-sm">{String(sitesError)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-72 flex-shrink-0 flex flex-col h-full overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <h1 className="text-base font-bold text-gray-900 leading-tight">Iowa Water Levels</h1>
          <p className="text-xs text-gray-500">
            {sitesLoading ? 'Loading…' : `${sites.length} river stations`}
          </p>
        </div>
        <div className="flex-1 min-h-0">
          {sitesLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <StationSidebar
              sites={sites}
              readings={readings}
              percentiles={percentiles}
              mapCenter={mapCenter}
              onSiteHover={setHoveredSiteId}
              selectedSiteId={hoveredSiteId}
            />
          )}
        </div>

        <div className="px-3 py-2 border-t border-gray-200 bg-white">
          <Legend />
        </div>
      </div>

      <div className="flex-1 relative">
        <IowaMap
          sites={sites}
          readings={readings}
          percentiles={percentiles}
          highlightedSiteId={hoveredSiteId}
          onMoveEnd={handleMoveEnd}
          onSiteClick={handleSiteClick}
          initialLat={initialLat}
          initialLng={initialLng}
          initialZoom={initialZoom}
        />
      </div>
    </div>
  )
}

function Legend() {
  const entries: PercentileClass[] = ['very-low', 'below-normal', 'normal', 'above-normal', 'high', 'no-data']
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2">
        {entries.map((cls) => (
          <div key={cls} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PERCENTILE_COLORS[cls] }}
            />
            <span className="text-xs text-gray-500 truncate">{PERCENTILE_LABELS[cls].split(' (')[0]}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 leading-snug">
        Colors show where today's streamflow ranks against all daily readings over the past 5 years.
      </p>
    </div>
  )
}
