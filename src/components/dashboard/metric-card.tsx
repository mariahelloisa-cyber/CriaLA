import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface MetricTrend {
  value: number
  direction: 'up' | 'down' | 'neutral'
  label?: string
}

interface MetricCardProps {
  title: string
  value: string
  description?: string
  icon?: LucideIcon
  trend?: MetricTrend
  tone?: 'primary' | 'success' | 'info' | 'warning' | 'neutral' | 'accent'
  loading?: boolean
  className?: string
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  primary: 'bg-brand-pink-soft text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-brand-blue-soft text-secondary',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-muted text-muted-foreground',
  /** Sem token de marca equivalente — usa a paleta violeta padrão do Tailwind, só para diversidade visual entre cards de indicador (ex.: "Matrículas vinculadas"). */
  accent: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
}

const trendClasses: Record<MetricTrend['direction'], string> = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
}

const trendIcon: Record<MetricTrend['direction'], typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  tone = 'neutral',
  loading,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn('flex items-center gap-3 p-4', className)}>
        <Skeleton className="size-12 shrink-0 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </Card>
    )
  }

  const TrendIcon = trend ? trendIcon[trend.direction] : null

  return (
    <Card className={cn('flex items-center gap-3 p-4', className)}>
      {Icon && (
        <span
          className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', toneClasses[tone])}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}

      <div className="flex flex-col">
        <span className="text-body-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-h3 font-semibold tracking-tight text-foreground">{value}</span>

        {description && <span className="text-caption text-muted-foreground">{description}</span>}

        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-1 text-caption font-medium', trendClasses[trend.direction])}>
            <TrendIcon className="size-3.5" aria-hidden="true" />
            <span>{Math.abs(trend.value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
            {trend.label && <span className="font-normal text-muted-foreground">{trend.label}</span>}
          </div>
        )}
      </div>
    </Card>
  )
}
