'use client'
import { cn } from '@/lib/utils'

interface SuggestedPromptProps {
  text: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function SuggestedPrompt({ text, onClick, disabled = false, className }: SuggestedPromptProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Send: ${text}`}
      className={cn(
        'rounded-full border border-border px-4 py-2 text-sm text-left transition-colors',
        'hover:bg-secondary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {text}
    </button>
  )
}
