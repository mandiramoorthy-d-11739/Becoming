'use client'

import { cn, getAccentColors } from '@/lib/utils'
import type { Identity, IdentityAccent } from '@/types'

const PILL_BASE =
  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-background'

const PILL_INACTIVE =
  'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground'

function activePillClasses(accent: IdentityAccent): string {
  const colors = getAccentColors(accent)
  return cn(colors.soft, colors.text, colors.border)
}

interface FilterPillProps {
  isActive: boolean
  accent: IdentityAccent
  onClick: () => void
  children: React.ReactNode
}

function FilterPill({ isActive, accent, onClick, children }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(PILL_BASE, isActive ? activePillClasses(accent) : PILL_INACTIVE)}
    >
      {children}
    </button>
  )
}

interface MapIdentityFilterProps {
  identities: Identity[]
  /** `undefined` means "All". */
  value?: string
  onChange: (identityId?: string) => void
  className?: string
}

export function MapIdentityFilter({ identities, value, onChange, className }: MapIdentityFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter the map by identity"
      // The negative margin lets focus rings breathe without clipping inside
      // the horizontal scroll container.
      className={cn('-mx-1 flex gap-2 overflow-x-auto px-1 pb-1', className)}
    >
      <FilterPill isActive={value === undefined} accent="violet" onClick={() => onChange(undefined)}>
        All
      </FilterPill>

      {identities.map(identity => (
        <FilterPill
          key={identity.id}
          isActive={value === identity.id}
          accent={identity.accent}
          onClick={() => onChange(identity.id)}
        >
          <span aria-hidden="true" className="mr-1.5">
            {identity.icon}
          </span>
          {identity.name}
        </FilterPill>
      ))}
    </div>
  )
}
