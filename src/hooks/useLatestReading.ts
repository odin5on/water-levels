import { useQuery } from '@tanstack/react-query'
import { getLatestReadings } from '../api/usgs'

export function useLatestReading(siteId: string) {
  return useQuery({
    queryKey: ['latest', siteId],
    queryFn: async () => {
      const map = await getLatestReadings([siteId])
      return map.get(siteId) ?? null
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })
}

export function useLatestReadings(siteIds: string[]) {
  return useQuery({
    queryKey: ['latest-batch', siteIds.slice().sort().join(',')],
    queryFn: () => getLatestReadings(siteIds),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    enabled: siteIds.length > 0,
  })
}
