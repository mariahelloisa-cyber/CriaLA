import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerGoalSummary } from '@/types/goals'

/**
 * Totais da equipe (seção 8 do prompt: "Meta total, Realizado total, %
 * equipe, Alunos realizados") — soma simples dos resumos individuais já
 * carregados, sem query adicional.
 */
export function GoalTeamSummary({ items }: { items: SellerGoalSummary[] }) {
  const totalTarget = items.reduce((sum, item) => sum + (item.goal?.financial_target ?? 0), 0)
  const totalRealized = items.reduce((sum, item) => sum + item.realizedAmount, 0)
  const totalStudentTarget = items.reduce((sum, item) => sum + (item.goal?.student_target ?? 0), 0)
  const totalStudentsRealized = items.reduce((sum, item) => sum + item.realizedStudents, 0)
  const teamPercent = totalTarget > 0 ? (totalRealized / totalTarget) * 100 : 0
  const sellersWithGoal = items.filter((item) => item.goal !== null).length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Meta da equipe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-h2 font-semibold text-foreground">{formatCentsToBRL(Math.round(totalRealized * 100))}</span>
            <span className="text-body-sm text-muted-foreground">
              de {sellersWithGoal > 0 ? formatCentsToBRL(Math.round(totalTarget * 100)) : 'sem metas cadastradas'}
            </span>
          </div>
          <Progress value={teamPercent} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos matriculados (vendas)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <span className="text-h2 font-semibold text-foreground">{totalStudentsRealized}</span>
          <span className="text-body-sm text-muted-foreground">
            de {sellersWithGoal > 0 ? totalStudentTarget : 'sem metas cadastradas'}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendedores com meta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <span className="text-h2 font-semibold text-foreground">
            {sellersWithGoal}/{items.length}
          </span>
          <span className="text-body-sm text-muted-foreground">vendedores com meta cadastrada neste período</span>
        </CardContent>
      </Card>
    </div>
  )
}
