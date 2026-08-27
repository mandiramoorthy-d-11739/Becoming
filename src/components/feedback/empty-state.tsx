import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center gap-4', className)}>
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <div className="space-y-2">
        <h3 className="font-medium text-lg text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>}
      </div>
      {action && (
        <Button variant="soft" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
