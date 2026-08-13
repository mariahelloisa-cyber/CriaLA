import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  label?: string
  showValue?: boolean
  className?: string
  indicatorClassName?: string
}

export function Progress({ value, label, showValue = true, className, indicatorClassName }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-caption text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span className="font-medium text-foreground">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full rounded-full bg-primary transition-[width] duration-300', indicatorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
