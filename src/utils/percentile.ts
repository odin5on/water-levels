import type { DailyValue, PercentileClass } from '../api/types'

export function computePercentile(currentValue: number, historical: DailyValue[]): number {
  if (historical.length === 0) return 50
  const below = historical.filter((d) => d.value <= currentValue).length
  return (below / historical.length) * 100
}

export function percentileClass(pct: number | null): PercentileClass {
  if (pct === null) return 'no-data'
  if (pct < 10) return 'very-low'
  if (pct < 25) return 'below-normal'
  if (pct < 75) return 'normal'
  if (pct < 90) return 'above-normal'
  return 'high'
}

export const PERCENTILE_COLORS: Record<PercentileClass, string> = {
  'very-low': '#ef4444',
  'below-normal': '#f97316',
  normal: '#22c55e',
  'above-normal': '#3b82f6',
  high: '#a855f7',
  'no-data': '#9ca3af',
}

export const PERCENTILE_LABELS: Record<PercentileClass, string> = {
  'very-low': 'Much below normal (<10th)',
  'below-normal': 'Below normal (10–25th)',
  normal: 'Normal (25–75th)',
  'above-normal': 'Above normal (75–90th)',
  high: 'Much above normal (>90th)',
  'no-data': 'No current data',
}
