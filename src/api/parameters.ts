export const PARAM_DISCHARGE = '00060' as const
export const PARAM_GAGE_HEIGHT = '00065' as const

export const STAT_MAX = '00001' as const
export const STAT_MIN = '00002' as const
export const STAT_MEAN = '00003' as const
export const STAT_INSTANTANEOUS = '00011' as const

export const PARAM_LABELS: Record<string, string> = {
  [PARAM_DISCHARGE]: 'Streamflow',
  [PARAM_GAGE_HEIGHT]: 'Gage Height',
}

export const PARAM_UNITS: Record<string, string> = {
  [PARAM_DISCHARGE]: 'cfs',
  [PARAM_GAGE_HEIGHT]: 'ft',
}
