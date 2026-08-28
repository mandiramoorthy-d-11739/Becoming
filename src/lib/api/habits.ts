import { Habit, HabitCheckin } from '@/types'
import { MOCK_HABITS, MOCK_CHECKINS } from '@/data/seed'
import { mockFetch } from './mock-client'
import { getStorage, setStorage } from '@/lib/storage'

const HABITS_KEY = 'becoming_habits'
const CHECKINS_KEY = 'becoming_checkins'

export async function getHabits(): Promise<Habit[]> {
  const stored = getStorage<Habit[]>(HABITS_KEY)
  return mockFetch(stored ?? MOCK_HABITS, 500)
}

export async function getHabit(id: string): Promise<Habit> {
  const habits = getStorage<Habit[]>(HABITS_KEY) ?? MOCK_HABITS
  const habit = habits.find(h => h.id === id)
  if (!habit) throw new Error(`Habit ${id} not found`)
  return mockFetch(habit, 300)
}

export async function createHabit(data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
  const habits = getStorage<Habit[]>(HABITS_KEY) ?? MOCK_HABITS
  const newHabit: Habit = {
    ...data,
    id: `habit_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  setStorage(HABITS_KEY, [...habits, newHabit])
  return mockFetch(newHabit, 600)
}

export async function updateHabit(id: string, patch: Partial<Habit>): Promise<Habit> {
  const habits = getStorage<Habit[]>(HABITS_KEY) ?? MOCK_HABITS
  const updated = habits.map(h => h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h)
  setStorage(HABITS_KEY, updated)
  const result = updated.find(h => h.id === id)!
  return mockFetch(result, 400)
}

export async function getCheckins(habitId?: string): Promise<HabitCheckin[]> {
  const stored = getStorage<HabitCheckin[]>(CHECKINS_KEY) ?? MOCK_CHECKINS
  const filtered = habitId ? stored.filter(c => c.habitId === habitId) : stored
  return mockFetch(filtered, 400)
}

export async function createCheckin(data: Omit<HabitCheckin, 'id' | 'createdAt'>): Promise<HabitCheckin> {
  const checkins = getStorage<HabitCheckin[]>(CHECKINS_KEY) ?? MOCK_CHECKINS
  const newCheckin: HabitCheckin = {
    ...data,
    id: `chk_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  const filtered = checkins.filter(c => !(c.habitId === data.habitId && c.date === data.date))
  setStorage(CHECKINS_KEY, [...filtered, newCheckin])
  return mockFetch(newCheckin, 500)
}
