import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message = "Something didn't load.", onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3 text-center', className)}>
      <p className="text-muted-foreground text-sm">{message}</p>
      <p className="text-muted-foreground/60 text-xs">We still have your progress.</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
      )}
    </div>
  )
}
