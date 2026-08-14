import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCentsToBRL } from '@/utils/currency'
import { monthLabel } from '@/utils/period'
import type { MonthlyRealized } from '@/types/goals'

/**
 * "Evolução das Metas" (Fase 23, evoluindo a versão simples da Fase 12):
 * meta x realizado por mês, com percentual quando há meta cadastrada. Reusa
 * o `Progress` do design system para a barra — mesmo componente já usado em
 * GoalSummaryCards/GoalTeamSummary para "meta x realizado" de um período
 * único, então o visual fica consistente com o resto da página em vez de um
 * gráfico novo e isolado. `Progress` já clampa a barra em 100% visualmente
 * mas não o número (mesmo comportamento documentado desde a Fase 12: meta
 * superada mostra >100%, não é bug).
 *
 * Quando não há meta cadastrada para o mês (`goalAmount === null` — todos os
 * vendedores do escopo sem meta naquele período, distinto de meta = 0), a
 * barra de progresso não é exibida (não há contra o que comparar) — só o
 * valor realizado, com uma nota explícita em vez de fingir 0%.
 */
export function GoalEvolution({ months }: { months: MonthlyRealized[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução das metas (últimos {months.length} meses)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {months.map((month) => {
          const key = `${month.year}-${month.month}`
          const label = `${monthLabel(month.month)}/${month.year}`
          const hasGoal = month.goalAmount !== null

          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-body-sm font-medium text-foreground">{label}</span>
                <span
                  className="text-caption text-muted-foreground"
                  title={
                    hasGoal
                      ? `Realizado ${formatCentsToBRL(Math.round(month.realizedAmount * 100))} de meta ${formatCentsToBRL(Math.round((month.goalAmount ?? 0) * 100))}`
                      : undefined
                  }
                >
                  {formatCentsToBRL(Math.round(month.realizedAmount * 100))}
                  {hasGoal && ` de ${formatCentsToBRL(Math.round((month.goalAmount ?? 0) * 100))}`}
                </span>
              </div>

              {hasGoal ? (
                <Progress value={month.financialPercent} />
              ) : (
                <>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-0 rounded-full bg-primary" />
                  </div>
                  <span className="text-caption text-muted-foreground">Sem meta cadastrada neste mês</span>
                </>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
