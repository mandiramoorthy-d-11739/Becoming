'use client'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/**
 * False while rendering on the server and during the first client render, true
 * afterwards. Use it before reading persisted state so the markup React
 * hydrates always matches the markup it rendered.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
