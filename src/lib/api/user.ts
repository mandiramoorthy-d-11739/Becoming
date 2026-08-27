import { User } from '@/types'
import { MOCK_USER } from '@/data/seed'
import { mockFetch } from './mock-client'
import { getStorage, setStorage } from '@/lib/storage'

const USER_KEY = 'becoming_user'

export async function getUser(): Promise<User> {
  const stored = getStorage<User>(USER_KEY)
  return mockFetch(stored ?? MOCK_USER, 300)
}

export async function updateUser(patch: Partial<User>): Promise<User> {
  const current = getStorage<User>(USER_KEY) ?? MOCK_USER
  const updated = { ...current, ...patch }
  setStorage(USER_KEY, updated)
  return mockFetch(updated, 400)
}
