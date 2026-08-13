import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Text } from './text'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = 'Não foi possível carregar os dados.',
  description = 'Tente novamente em instantes.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-border px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <Text variant="h4">{title}</Text>
        <Text variant="body-sm" className="max-w-sm text-muted-foreground">
          {description}
        </Text>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
