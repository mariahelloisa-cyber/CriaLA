import { Progress } from '@/components/ui/progress'
import { rankSellersByValue } from '@/services/goals.service'
import type { SellerGoalSummary } from '@/types/goals'
import { formatCentsToBRL } from '@/utils/currency'

/**
 * Ranking simplificado só da Visão Geral (pedido do usuário, com referência
 * de código) — círculo numerado + barra de progresso, sem avatar nem botão
 * "Editar meta". Não é o mesmo componente de `GoalRanking`
 * (goals-page.tsx e reports/goals-vs-realized-section.tsx usam a versão
 * completa, com a ação de editar meta) — este aqui existe só para leitura no
 * Dashboard, então `GoalRanking` não foi tocado.
 *
 * Fase 19: ordenação trocada de percentual para `rankSellersByValue`
 * (mesma função usada em GoalRanking) — "maior valor primeiro" é uma regra
 * de negócio única e centralizada; as duas listagens de ranking do sistema
 * não podiam mostrar posições diferentes para o mesmo vendedor.
 */
export function SellerRankingList({ items }: { items: SellerGoalSummary[] }) {
  const ranked = rankSellersByValue(items)

  return (
    <ul className="flex flex-col gap-5">
      {ranked.map((item) => (
        <li key={item.seller.id} className="flex items-center gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-bold text-secondary-foreground">
            {item.rank}º
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="truncate text-body-sm font-semibold text-foreground">{item.seller.full_name}</span>
              <span className="shrink-0 text-body-sm font-medium text-foreground">
                {formatCentsToBRL(Math.round(item.realizedAmount * 100))}
                {item.goal && (
                  <span className="text-caption font-normal text-muted-foreground">
                    {' '}
                    / {formatCentsToBRL(Math.round(item.goal.financial_target * 100))}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={item.financialPercent} showValue={false} />
            </div>
            <p className="mt-1 text-caption text-muted-foreground">
              {item.goal
                ? `${item.realizedStudents} matrículas · ${Math.round(item.financialPercent)}% da meta`
                : `${item.realizedStudents} matrículas · sem meta cadastrada`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
