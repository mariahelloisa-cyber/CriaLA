import { Target } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { rankSellersByValue } from '@/services/goals.service'
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerGoalSummary, SellerOption } from '@/types/goals'

interface GoalRankingProps {
  items: SellerGoalSummary[]
  onEditGoal: (seller: SellerOption) => void
}

/**
 * Ranking do gerente (Fase 19, decisão "RANKING"): ordenado por VALOR
 * realizado (maior primeiro — regra explícita do usuário, não por
 * percentual da meta como na versão original da Fase 12/16). Posição
 * calculada de forma determinística por rankSellersByValue (empate: valor,
 * depois nome, depois id — nunca depende da ordem de chegada dos dados).
 * O percentual da meta continua exibido (Progress + %), só deixou de ser o
 * critério de ordenação.
 */
export function GoalRanking({ items, onEditGoal }: GoalRankingProps) {
  const ranked = rankSellersByValue(items)

  return (
    <div className="flex flex-col gap-2">
      {ranked.map((item) => (
        <Card key={item.seller.id} className="flex flex-wrap items-center gap-3 p-3">
          <span className="w-6 shrink-0 text-center text-body-sm font-semibold text-muted-foreground">
            {item.rank}º
          </span>
          <Avatar name={item.seller.full_name} size="sm" />
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <span className="truncate text-body-sm font-medium text-foreground">{item.seller.full_name}</span>
              <span className="shrink-0 text-body-sm font-medium text-foreground">
                {formatCentsToBRL(Math.round(item.realizedAmount * 100))}
              </span>
            </div>
            <Progress value={item.financialPercent} showValue={false} />
            <span className="text-caption text-muted-foreground">
              {item.goal ? `Meta: ${formatCentsToBRL(Math.round(item.goal.financial_target * 100))}` : 'Sem meta cadastrada'}
              {' · '}
              {Math.round(item.financialPercent)}% da meta
              {' · '}
              {item.realizedStudents} {item.realizedStudents === 1 ? 'aluno' : 'alunos'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onEditGoal(item.seller)} className="shrink-0">
            <Target className="size-4" aria-hidden="true" />
            {item.goal ? 'Editar meta' : 'Definir meta'}
          </Button>
        </Card>
      ))}
    </div>
  )
}
