import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  detail?: string
  icon: LucideIcon
  /** Card em destaque (fundo sólido `--primary`) — usar em no máximo 1 card por linha. */
  highlight?: boolean
}

/**
 * Card de indicador (rótulo+ícone, valor grande, legenda) — extraído de
 * `pages/dashboard/components/overview-stats-cards.tsx` (Fase pós-18) para
 * reuso em outras páginas com o mesmo padrão visual (ex.: Vendas).
 */
export function StatCard({ title, value, detail, icon: Icon, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5 shadow-md',
        highlight && 'border-transparent bg-primary text-primary-foreground',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('text-body-sm font-medium', highlight ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          {title}
        </span>
        <Icon className={cn('size-4 shrink-0', highlight ? 'text-primary-foreground/80' : 'text-primary')} aria-hidden="true" />
      </div>
      <span className="mt-3 block text-h3 font-bold tracking-tight">{value}</span>
      {detail && (
        <span className={cn('mt-1 block text-caption', highlight ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
          {detail}
        </span>
      )}
    </div>
  )
}
