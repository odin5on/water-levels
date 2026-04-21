export interface MonitoringLocationProperties {
  id: string
  agency_code: string
  agency_name: string
  monitoring_location_number: string
  monitoring_location_name: string
  state_name: string
  county_name: string
  site_type_code: string
  site_type: string
  drainage_area: number | null
  contributing_drainage_area: number | null
  time_zone_abbreviation: string
  uses_daylight_savings: string
  altitude: number | null
}

export interface MonitoringLocationFeature {
  type: 'Feature'
  id: string
  properties: MonitoringLocationProperties
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface ObservationProperties {
  id: string
  time_series_id: string
  monitoring_location_id: string
  parameter_code: string
  statistic_id: string
  time: string
  value: string
  unit_of_measure: string
  approval_status: string
  qualifier: string | null
}

export interface ObservationFeature {
  type: 'Feature'
  id: string
  properties: ObservationProperties
  geometry: { type: 'Point'; coordinates: [number, number] } | null
}

export interface FeatureCollection<F> {
  type: 'FeatureCollection'
  features: F[]
  numberMatched: number | null
  numberReturned: number
  links?: Array<{ rel: string; href: string }>
}

export type MonitoringLocationCollection = FeatureCollection<MonitoringLocationFeature>
export type ObservationCollection = FeatureCollection<ObservationFeature>

export type PercentileClass = 'very-low' | 'below-normal' | 'normal' | 'above-normal' | 'high' | 'no-data'

export interface LatestReading {
  discharge: number | null
  dischargeTime: string | null
  dischargeProvisional: boolean
  gageHeight: number | null
  gageHeightTime: string | null
  gageHeightProvisional: boolean
}

export interface DailyValue {
  date: string
  value: number
}
