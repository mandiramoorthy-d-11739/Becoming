import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'system' | 'light' | 'dark'

interface AppStore {
  theme: Theme
  reducedMotion: boolean
  setTheme: (theme: Theme) => void
  setReducedMotion: (v: boolean) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'system',
      reducedMotion: false,
      setTheme: (theme) => set({ theme }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    { name: 'becoming_app' }
  )
)
