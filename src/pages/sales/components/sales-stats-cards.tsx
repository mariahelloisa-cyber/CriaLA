import { CreditCard, Receipt, Wallet } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import type { SalesSummary } from '@/services/sales.service'
import { formatCentsToBRL } from '@/utils/currency'

/**
 * "Vendas registradas / Valor bruto contratado / Valor apurado em meta"
 * (pedido do usuário, referência visual) — `goalAmount` é o mesmo
 * `goal_amount` já usado no módulo de Metas (PDF seção 5: à vista/cartão =
 * 100% do valor; boleto = só a 1ª parcela), não um número novo.
 */
export function SalesStatsCards({ summary }: { summary: SalesSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard title="Vendas registradas" value={String(summary.count)} icon={Receipt} />
      <StatCard
        title="Valor bruto contratado"
        value={formatCentsToBRL(Math.round(summary.totalAmount * 100))}
        icon={Wallet}
      />
      <StatCard
        title="Valor apurado em meta"
        value={formatCentsToBRL(Math.round(summary.goalAmount * 100))}
        detail="Boleto conta apenas a 1ª mensalidade"
        icon={CreditCard}
        highlight
      />
    </div>
  )
}
