/**
 * All USGS Modernized Water Data API (OGC) calls live here.
 * API status: alpha — schema/URLs may change. Update only this file.
 * Docs: https://api.waterdata.usgs.gov/ogcapi/v0/
 */

import type {
  MonitoringLocationFeature,
  ObservationFeature,
  LatestReading,
  DailyValue,
} from './types'
import { PARAM_DISCHARGE, PARAM_GAGE_HEIGHT } from './parameters'

const BASE = 'https://api.waterdata.usgs.gov/ogcapi/v0'

function apiKey(): string {
  return import.meta.env.VITE_USGS_API_KEY ?? ''
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const url = new URL(`${BASE}${path}`)
  const key = apiKey()
  if (key) url.searchParams.set('api_key', key)
  url.searchParams.set('f', 'json')
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== undefined && v !== null) {
      url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function fetchAll<F>(url: string): Promise<F[]> {
  const features: F[] = []
  let next: string | null = url

  while (next) {
    const res = await fetch(next)
    if (!res.ok) throw new Error(`USGS API ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as { features: F[]; links?: Array<{ rel: string; href: string }> }
    features.push(...(data.features ?? []))
    const nextLink = data.links?.find((l) => l.rel === 'next')
    next = nextLink ? nextLink.href : null
  }

  return features
}

export async function getRiverSites(): Promise<MonitoringLocationFeature[]> {
  const url = buildUrl('/collections/monitoring-locations/items', {
    state_name: 'Iowa',
    site_type_code: 'ST',
    agency_code: 'USGS',
    limit: 1000,
  })
  const allSites = await fetchAll<MonitoringLocationFeature>(url)

  // Filter to sites that have ever appeared in latest-continuous (i.e. have a real-time
  // sensor). This removes discontinued/historical sites that only have daily or paper records.
  const ids = allSites.map((s) => s.id)
  const activeSiteIds = await getActiveSiteIds(ids)
  return allSites.filter((s) => activeSiteIds.has(s.id))
}

async function getActiveSiteIds(siteIds: string[]): Promise<Set<string>> {
  const CHUNK = 100
  const active = new Set<string>()
  for (let i = 0; i < siteIds.length; i += CHUNK) {
    const chunk = siteIds.slice(i, i + CHUNK)
    const url = buildUrl('/collections/latest-continuous/items', {
      monitoring_location_id: chunk.join(','),
      parameter_code: [PARAM_DISCHARGE, PARAM_GAGE_HEIGHT].join(','),
      limit: chunk.length * 2,
    })
    const features = await fetchAll<ObservationFeature>(url)
    for (const f of features) active.add(f.properties.monitoring_location_id)
  }
  return active
}

function nowRange(hours: number): string {
  const end = new Date()
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000)
  return `${start.toISOString().replace(/\.\d+Z$/, 'Z')}/${end.toISOString().replace(/\.\d+Z$/, 'Z')}`
}

function dayRange(days: number): string {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return (
    start.toISOString().split('T')[0] +
    '/' +
    end.toISOString().split('T')[0]
  )
}

const ACTIVE_THRESHOLD_HOURS = 25

export async function getLatestReadings(
  siteIds: string[],
  paramCodes: string[] = [PARAM_DISCHARGE, PARAM_GAGE_HEIGHT],
): Promise<Map<string, LatestReading>> {
  if (siteIds.length === 0) return new Map()

  const CHUNK = 100
  const allFeatures: ObservationFeature[] = []

  for (let i = 0; i < siteIds.length; i += CHUNK) {
    const chunk = siteIds.slice(i, i + CHUNK)
    // latest-continuous returns the single most recent reading per site/parameter —
    // no time range needed and ~20x fewer records than a windowed continuous query.
    const url = buildUrl('/collections/latest-continuous/items', {
      monitoring_location_id: chunk.join(','),
      parameter_code: paramCodes.join(','),
      limit: chunk.length * paramCodes.length * 2,
    })
    const features = await fetchAll<ObservationFeature>(url)
    allFeatures.push(...features)
  }

  const map = new Map<string, LatestReading>()

  for (const f of allFeatures) {
    const p = f.properties
    const siteId = p.monitoring_location_id
    if (!map.has(siteId)) {
      map.set(siteId, {
        discharge: null,
        dischargeTime: null,
        dischargeProvisional: false,
        gageHeight: null,
        gageHeightTime: null,
        gageHeightProvisional: false,
      })
    }
    const reading = map.get(siteId)!
    const val = parseFloat(p.value)
    const provisional = p.approval_status === 'Provisional'
    const ageHours = (Date.now() - new Date(p.time).getTime()) / 3_600_000
    const recent = ageHours <= ACTIVE_THRESHOLD_HOURS

    if (p.parameter_code === PARAM_DISCHARGE) {
      if (reading.dischargeTime === null || p.time > reading.dischargeTime) {
        reading.discharge = recent && !isNaN(val) ? val : null
        reading.dischargeTime = p.time
        reading.dischargeProvisional = provisional
      }
    } else if (p.parameter_code === PARAM_GAGE_HEIGHT) {
      if (reading.gageHeightTime === null || p.time > reading.gageHeightTime) {
        reading.gageHeight = recent && !isNaN(val) ? val : null
        reading.gageHeightTime = p.time
        reading.gageHeightProvisional = provisional
      }
    }
  }

  return map
}

export async function getDailyValues(
  siteId: string,
  paramCode: string,
  startDate: string,
  endDate: string,
): Promise<DailyValue[]> {
  const url = buildUrl('/collections/daily/items', {
    monitoring_location_id: siteId,
    parameter_code: paramCode,
    statistic_id: '00003',
    datetime: `${startDate}/${endDate}`,
    limit: 10000,
  })
  const features = await fetchAll<ObservationFeature>(url)
  return features
    .map((f) => ({ date: f.properties.time, value: parseFloat(f.properties.value) }))
    .filter((d) => !isNaN(d.value))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getContinuousValues(
  siteId: string,
  paramCode: string,
  days: number,
): Promise<DailyValue[]> {
  const url = buildUrl('/collections/continuous/items', {
    monitoring_location_id: siteId,
    parameter_code: paramCode,
    datetime: nowRange(days * 24),
    limit: days * 100,
  })
  const features = await fetchAll<ObservationFeature>(url)
  return features
    .map((f) => ({ date: f.properties.time, value: parseFloat(f.properties.value) }))
    .filter((d) => !isNaN(d.value))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getHistoricalDailyForPercentile(
  siteId: string,
  paramCode: string,
  years: number = 5,
): Promise<DailyValue[]> {
  const end = new Date()
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - years)
  return getDailyValues(
    siteId,
    paramCode,
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0],
  )
}

export async function getBatchDailyForPercentile(
  siteIds: string[],
  paramCode: string,
  days: number = 365,
): Promise<Map<string, DailyValue[]>> {
  if (siteIds.length === 0) return new Map()

  const end = new Date().toISOString().split('T')[0]
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Keep chunks small: 5yr × 20 sites = ~36k records, which stays close to the
  // API's effective page size and keeps pagination predictable.
  const CHUNK = 20
  const result = new Map<string, DailyValue[]>()

  for (let i = 0; i < siteIds.length; i += CHUNK) {
    const chunk = siteIds.slice(i, i + CHUNK)
    const url = buildUrl('/collections/daily/items', {
      monitoring_location_id: chunk.join(','),
      parameter_code: paramCode,
      statistic_id: '00003',
      datetime: `${start}/${end}`,
      limit: 10000,
    })
    const features = await fetchAll<ObservationFeature>(url)
    for (const f of features) {
      const sid = f.properties.monitoring_location_id
      const val = parseFloat(f.properties.value)
      if (isNaN(val)) continue
      if (!result.has(sid)) result.set(sid, [])
      result.get(sid)!.push({ date: f.properties.time, value: val })
    }
  }

  return result
}

export { dayRange }
