import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Text } from './text'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Text variant="h4">{title}</Text>
        {description && (
          <Text variant="body-sm" className="max-w-sm text-muted-foreground">
            {description}
          </Text>
        )}
      </div>
      {action}
    </div>
  )
}
