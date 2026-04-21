import { useQuery } from '@tanstack/react-query'
import { getDailyValues, getContinuousValues, getHistoricalDailyForPercentile, getBatchDailyForPercentile } from '../api/usgs'
import { subtractDays, subtractYears, todayISO } from '../utils/date'

export type TimeRange = '30d' | '1yr' | '5yr' | 'max'

function dateRange(range: TimeRange): { start: string; end: string } {
  const end = todayISO()
  switch (range) {
    case '30d': return { start: subtractDays(30), end }
    case '1yr': return { start: subtractYears(1), end }
    case '5yr': return { start: subtractYears(5), end }
    case 'max': return { start: subtractYears(20), end }
  }
}

export function useDaily(siteId: string, paramCode: string, range: TimeRange) {
  const { start, end } = dateRange(range)
  return useQuery({
    queryKey: ['daily', siteId, paramCode, range],
    queryFn: () => getDailyValues(siteId, paramCode, start, end),
    staleTime: 60 * 60 * 1000,
    enabled: !!siteId && !!paramCode,
  })
}

export function useSparkline(siteId: string, paramCode: string) {
  return useQuery({
    queryKey: ['sparkline', siteId, paramCode],
    queryFn: () => getContinuousValues(siteId, paramCode, 7),
    staleTime: 15 * 60 * 1000,
  })
}

export function usePercentileHistory(siteId: string, paramCode: string) {
  return useQuery({
    queryKey: ['percentile-history', siteId, paramCode],
    queryFn: () => getHistoricalDailyForPercentile(siteId, paramCode, 5),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: !!siteId,
  })
}

function stableKey(ids: string[]): string {
  const sorted = ids.slice().sort()
  // Use count + first/last ID to avoid a multi-KB cache key
  return `${sorted.length}:${sorted[0] ?? ''}:${sorted[sorted.length - 1] ?? ''}`
}

export function useBatchPercentile(siteIds: string[], paramCode: string) {
  return useQuery({
    queryKey: ['batch-percentile', stableKey(siteIds), paramCode],
    queryFn: () => getBatchDailyForPercentile(siteIds, paramCode, 365 * 5),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: siteIds.length > 0,
  })
}
