'use client'

import { useCallback, useSyncExternalStore } from 'react'

/** Tailwind's `md` breakpoint, mirrored for the JS-driven parts of the map. */
export const MD_QUERY = '(min-width: 768px)'

// One MediaQueryList per query, so `getSnapshot` stays cheap and listeners are
// shared between every component asking the same question.
const mediaQueryLists = new Map<string, MediaQueryList>()

function getMediaQueryList(query: string): MediaQueryList {
  let mql = mediaQueryLists.get(query)
  if (!mql) {
    mql = window.matchMedia(query)
    mediaQueryLists.set(query, mql)
  }
  return mql
}

/**
 * Tracks a CSS media query. Returns `false` on the server and during the first
 * client render so the markup React hydrates always matches what it rendered,
 * then re-renders with the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = getMediaQueryList(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => getMediaQueryList(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
