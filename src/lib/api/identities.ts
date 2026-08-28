import { Identity } from '@/types'
import { MOCK_IDENTITIES } from '@/data/seed'
import { mockFetch } from './mock-client'
import { getStorage, setStorage } from '@/lib/storage'

const KEY = 'becoming_identities'

export async function getIdentities(): Promise<Identity[]> {
  return mockFetch(getStorage<Identity[]>(KEY) ?? MOCK_IDENTITIES, 400)
}

export async function createIdentity(data: Omit<Identity, 'id' | 'createdAt'>): Promise<Identity> {
  const identities = getStorage<Identity[]>(KEY) ?? MOCK_IDENTITIES
  const newIdentity: Identity = { ...data, id: `id_${Date.now()}`, createdAt: new Date().toISOString() }
  setStorage(KEY, [...identities, newIdentity])
  return mockFetch(newIdentity, 600)
}

export async function updateIdentity(id: string, patch: Partial<Identity>): Promise<Identity> {
  const identities = getStorage<Identity[]>(KEY) ?? MOCK_IDENTITIES
  const updated = identities.map(i => i.id === id ? { ...i, ...patch } : i)
  setStorage(KEY, updated)
  return mockFetch(updated.find(i => i.id === id)!, 400)
}
