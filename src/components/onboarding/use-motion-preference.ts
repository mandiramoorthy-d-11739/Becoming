'use client'
import { useReducedMotion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { useHydrated } from './use-hydrated'

/**
 * True when motion should be kept to a minimum, honouring both the OS setting
 * and the in-app preference. Returns false until hydrated so the server and the
 * first client render agree.
 */
export function useMotionPreference(): boolean {
  const systemPrefersReduced = useReducedMotion()
  const appPrefersReduced = useAppStore((state) => state.reducedMotion)
  const hydrated = useHydrated()

  if (!hydrated) return false
  return systemPrefersReduced === true || appPrefersReduced
}
