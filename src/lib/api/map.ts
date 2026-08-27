import { BecomingMapDay, MapRange } from '@/types'
import { MOCK_MAP_DATA } from '@/data/seed'
import { mockFetch } from './mock-client'
import { getDateRange, toDateString } from '@/lib/utils'

export async function getMapData(range: MapRange = '90d', identityId?: string): Promise<BecomingMapDay[]> {
  const { start, end } = getDateRange(range)
  let data = MOCK_MAP_DATA.filter(d => {
    const date = new Date(d.date)
    return date >= start && date <= end
  })
  if (identityId) {
    data = data.map(d => ({
      ...d,
      intensity: d.identityIds.includes(identityId) ? d.intensity : 0 as const,
    }))
  }
  return mockFetch(data, 700)
}
