import { MoodCheckin } from '@/types'
import { MOCK_MOODS } from '@/data/seed'
import { mockFetch } from './mock-client'
import { getStorage, setStorage } from '@/lib/storage'

const KEY = 'becoming_moods'

export async function getMoodHistory(): Promise<MoodCheckin[]> {
  return mockFetch(getStorage<MoodCheckin[]>(KEY) ?? MOCK_MOODS, 400)
}

export async function createMoodCheckin(data: Omit<MoodCheckin, 'id' | 'createdAt'>): Promise<MoodCheckin> {
  const moods = getStorage<MoodCheckin[]>(KEY) ?? MOCK_MOODS
  const newMood: MoodCheckin = { ...data, id: `mood_${Date.now()}`, createdAt: new Date().toISOString() }
  const filtered = moods.filter(m => m.date !== data.date)
  setStorage(KEY, [...filtered, newMood])
  return mockFetch(newMood, 500)
}
