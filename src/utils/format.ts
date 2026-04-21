export function formatDischarge(val: number | null): string {
  if (val === null) return '—'
  if (val >= 10000) return `${(val / 1000).toFixed(1)}k cfs`
  return `${val.toLocaleString()} cfs`
}

export function formatGageHeight(val: number | null): string {
  if (val === null) return '—'
  return `${val.toFixed(2)} ft`
}

export function formatNumber(val: number | null, unit: string): string {
  if (val === null) return '—'
  return `${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`
}

export function formatSiteId(id: string): string {
  return id.replace(/^USGS-/, '')
}
