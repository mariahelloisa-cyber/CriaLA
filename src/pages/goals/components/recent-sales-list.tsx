import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { formatCentsToBRL } from '@/utils/currency'
import { formatDateBr } from '@/utils/format-date'
import type { SaleListItem } from '@/types/sales'

/**
 * "Vendas que compõem o realizado" (seção 7 do prompt) — reaproveita
 * listSales() do módulo de Vendas (Fase 11), já filtrado por vendedor e
 * período pelo hook (use-goals-dashboard.ts). Só as 5 mais recentes; "Ver
 * todas" leva para a listagem completa de Vendas.
 */
export function RecentSalesList({ sales }: { sales: SaleListItem[] }) {
  if (sales.length === 0) {
    return <p className="text-body-sm text-muted-foreground">Nenhuma venda no período.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {sales.map((sale) => (
          <li key={sale.id}>
            <Link to={ROUTES.saleDetail(sale.id)}>
              <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40">
                <Avatar name={sale.student.full_name} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-sm font-medium text-foreground">{sale.student.full_name}</span>
                  <span className="truncate text-caption text-muted-foreground">
                    {sale.course.name} · {formatDateBr(sale.sale_date)}
                  </span>
                </div>
                <span className="shrink-0 text-body-sm font-medium text-foreground">
                  {formatCentsToBRL(Math.round(sale.total_amount * 100))}
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <Link to={ROUTES.sales} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'self-start')}>
        Ver todas as vendas →
      </Link>
    </div>
  )
}
