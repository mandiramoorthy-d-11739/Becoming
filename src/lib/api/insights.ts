import { Insight } from '@/types'
import { MOCK_INSIGHTS } from '@/data/seed'
import { mockFetch } from './mock-client'
import { getStorage, setStorage } from '@/lib/storage'

const KEY = 'becoming_insights'

export async function getInsights(): Promise<Insight[]> {
  return mockFetch(getStorage<Insight[]>(KEY) ?? MOCK_INSIGHTS, 600)
}

export async function updateInsight(id: string, patch: Partial<Insight>): Promise<Insight> {
  const insights = getStorage<Insight[]>(KEY) ?? MOCK_INSIGHTS
  const updated = insights.map(i => i.id === id ? { ...i, ...patch } : i)
  setStorage(KEY, updated)
  return mockFetch(updated.find(i => i.id === id)!, 400)
}
