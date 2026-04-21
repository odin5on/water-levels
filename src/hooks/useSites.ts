import { useQuery } from '@tanstack/react-query'
import { getRiverSites } from '../api/usgs'

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: getRiverSites,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}
