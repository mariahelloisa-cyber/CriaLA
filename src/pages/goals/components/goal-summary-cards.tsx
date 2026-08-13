import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerGoalSummary } from '@/types/goals'

function financialDiffLabel(diff: number | null): string {
  if (diff === null) return 'Sem meta financeira cadastrada para este período.'
  const amount = formatCentsToBRL(Math.round(Math.abs(diff) * 100))
  return diff <= 0 ? `Meta superada em ${amount}` : `Faltam ${amount} para a meta`
}

function studentDiffLabel(diff: number | null): string {
  if (diff === null) return 'Sem meta de alunos cadastrada para este período.'
  const count = Math.abs(diff)
  return diff <= 0
    ? `Meta superada em ${count} aluno${count === 1 ? '' : 's'}`
    : `Faltam ${count} aluno${count === 1 ? '' : 's'} para a meta`
}

/**
 * Cards de "Meta financeira" e "Meta de alunos" para UM vendedor no período.
 * `summary.goal === null` (sem linha em goals) é tratado como "sem meta
 * cadastrada" — diferente de meta = 0, mas ambos mostram 0% (proteção contra
 * NaN/Infinity — ver services/goals.service.ts:summarizeSellers).
 */
export function GoalSummaryCards({ summary }: { summary: SellerGoalSummary }) {
  const financialTargetCents = Math.round((summary.goal?.financial_target ?? 0) * 100)
  const realizedAmountCents = Math.round(summary.realizedAmount * 100)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Meta financeira</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-h2 font-semibold text-foreground">{formatCentsToBRL(realizedAmountCents)}</span>
            <span className="text-body-sm text-muted-foreground">
              de {summary.goal ? formatCentsToBRL(financialTargetCents) : 'sem meta'}
            </span>
          </div>
          <Progress value={summary.financialPercent} />
          <p className="text-caption text-muted-foreground">{financialDiffLabel(summary.financialDiff)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta de alunos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-h2 font-semibold text-foreground">{summary.realizedStudents}</span>
            <span className="text-body-sm text-muted-foreground">
              de {summary.goal ? summary.goal.student_target : 'sem meta'}
            </span>
          </div>
          <Progress value={summary.studentPercent} />
          <p className="text-caption text-muted-foreground">{studentDiffLabel(summary.studentDiff)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
