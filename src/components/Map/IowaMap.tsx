import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { MonitoringLocationFeature, PercentileClass } from '../../api/types'
import { PERCENTILE_COLORS } from '../../utils/percentile'
import type { LatestReading } from '../../api/types'
import { formatDischarge, formatGageHeight } from '../../utils/format'

const IOWA_CENTER: [number, number] = [-93.5, 42.0]
const IOWA_ZOOM = 6.5

interface Props {
  sites: MonitoringLocationFeature[]
  readings: Map<string, LatestReading> | undefined
  percentiles: Map<string, PercentileClass>
  highlightedSiteId?: string | null
  onMoveEnd?: (center: [number, number]) => void
  onSiteClick: (siteId: string) => void
  initialLat?: number
  initialLng?: number
  initialZoom?: number
}

export function IowaMap({
  sites,
  readings,
  percentiles,
  highlightedSiteId,
  onMoveEnd,
  onSiteClick,
  initialLat,
  initialLng,
  initialZoom,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null)
  const onMoveEndRef = useRef(onMoveEnd)
  useEffect(() => { onMoveEndRef.current = onMoveEnd })
  const onSiteClickRef = useRef(onSiteClick)
  useEffect(() => { onSiteClickRef.current = onSiteClick })
  const activeRef = useRef(true)
  const clickedRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)

  const getColor = useCallback(
    (siteId: string): string => {
      const cls = percentiles.get(siteId) ?? 'no-data'
      return PERCENTILE_COLORS[cls]
    },
    [percentiles],
  )

  const makeMarkerEl = useCallback(
    (siteId: string, highlighted: boolean): HTMLDivElement => {
      const el = document.createElement('div')
      const color = getColor(siteId)
      el.className = 'station-marker'
      el.style.cssText = `
        width: ${highlighted ? '16px' : '12px'};
        height: ${highlighted ? '16px' : '12px'};
        border-radius: 50%;
        background: ${color};
        border: ${highlighted ? '3px' : '2px'} solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.35);
        cursor: pointer;
        transition: width 0.1s, height 0.1s;
      `
      return el
    },
    [getColor],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [initialLng ?? IOWA_CENTER[0], initialLat ?? IOWA_CENTER[1]],
      zoom: initialZoom ?? IOWA_ZOOM,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('moveend', () => {
      if (!activeRef.current || clickedRef.current) return
      const c = map.getCenter()
      onMoveEndRef.current?.([c.lng, c.lat])
    })

    mapRef.current = map
    setMapReady(true)
    return () => {
      activeRef.current = false
      setMapReady(false)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || sites.length === 0) return

    const existing = new Set(markersRef.current.keys())

    for (const site of sites) {
      const id = site.id
      const [lng, lat] = site.geometry.coordinates
      const highlighted = id === highlightedSiteId

      if (markersRef.current.has(id)) {
        const marker = markersRef.current.get(id)!
        const el = marker.getElement()
        const color = getColor(id)
        el.style.background = color
        el.style.width = highlighted ? '16px' : '12px'
        el.style.height = highlighted ? '16px' : '12px'
        el.style.borderWidth = highlighted ? '3px' : '2px'
        existing.delete(id)
        continue
      }

      const el = makeMarkerEl(id, highlighted)
      const name = site.properties.monitoring_location_name

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)

      el.addEventListener('mouseenter', () => {
        const r = readings?.get(id)
        if (hoverPopupRef.current) hoverPopupRef.current.remove()
        hoverPopupRef.current = new maplibregl.Popup({
          offset: 10,
          closeButton: false,
          closeOnClick: false,
          className: 'station-hover-popup',
        })
          .setLngLat([lng, lat])
          .setHTML(buildHoverHtml(name, r))
          .addTo(map)
      })

      el.addEventListener('mouseleave', () => {
        hoverPopupRef.current?.remove()
        hoverPopupRef.current = null
      })

      el.addEventListener('click', () => {
        clickedRef.current = true
        hoverPopupRef.current?.remove()
        hoverPopupRef.current = null
        onSiteClickRef.current(id)
      })

      markersRef.current.set(id, marker)
      existing.delete(id)
    }

    for (const id of existing) {
      markersRef.current.get(id)?.remove()
      markersRef.current.delete(id)
    }
  }, [sites, percentiles, readings, highlightedSiteId, getColor, makeMarkerEl, mapReady])

  return <div ref={containerRef} className="w-full h-full" />
}

function buildHoverHtml(name: string, r: LatestReading | undefined): string {
  const discharge = r?.discharge != null ? formatDischarge(r.discharge) : null
  const gageHeight = r?.gageHeight != null ? formatGageHeight(r.gageHeight) : null
  const stats = [discharge, gageHeight].filter(Boolean).join(' · ')

  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.4;max-width:220px">
      <div style="font-weight:600;font-size:13px">${escHtml(name)}</div>
      ${stats ? `<div style="color:#6b7280;margin-top:2px">${escHtml(stats)}</div>` : ''}
    </div>
  `
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
