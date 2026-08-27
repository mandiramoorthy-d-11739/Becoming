import { sleep } from '@/lib/utils'

export async function mockFetch<T>(data: T, delay = 600, errorRate = 0): Promise<T> {
  await sleep(delay)
  if (errorRate > 0 && Math.random() < errorRate) {
    throw new Error('Mock API error')
  }
  return data
}
