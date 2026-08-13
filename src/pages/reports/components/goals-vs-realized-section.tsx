import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Text } from '@/components/ui/text'
import { Target } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { GoalEvolution } from '@/pages/goals/components/goal-evolution'
import { GoalRanking } from '@/pages/goals/components/goal-ranking'
import { GoalSummaryCards } from '@/pages/goals/components/goal-summary-cards'
import { GoalTeamSummary } from '@/pages/goals/components/goal-team-summary'
import { PeriodSelector } from '@/pages/goals/components/period-selector'
import { useGoalPeriod } from '@/pages/goals/hooks/use-goal-period'
import { useGoalsDashboard } from '@/pages/goals/hooks/use-goals-dashboard'
import { useScopedSellers } from '@/pages/goals/hooks/use-scoped-sellers'
import { currentPeriod, periodsEqual } from '@/utils/period'

/**
 * "Metas x realizado" (seção 5 do prompt): 100% reaproveitado da Fase 12 —
 * mesmos hooks/componentes de pages/goals, nada recalculado aqui. Só leitura
 * (o cadastro/edição de meta continua exclusivo de /metas — "Editar meta"
 * aqui navega para lá em vez de abrir um segundo Dialog, para não duplicar
 * essa responsabilidade em dois lugares).
 *
 * Usa seu PRÓPRIO seletor de período (mês/ano, via useGoalPeriod), separado
 * do filtro de intervalo livre (De/Até) do resto de Relatórios — `goals` é
 * inerentemente mensal (reference_month/reference_year), então não haveria
 * como mapear um intervalo arbitrário para uma meta de forma não-ambígua.
 * Isso é explicado na própria UI.
 */
export function GoalsVsRealizedSection() {
  const navigate = useNavigate()
  const { period, goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useGoalPeriod()
  const isCurrentPeriod = periodsEqual(period, currentPeriod())

  const { isManager, scopedSellers, effectiveSellerId, enabled, isSingleView } = useScopedSellers()

  const { summaries, evolution, state, error, retry } = useGoalsDashboard({
    period,
    sellers: scopedSellers,
    sellerId: effectiveSellerId,
    enabled,
  })

  const singleSummary = isSingleView ? (summaries[0] ?? null) : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="caption" className="text-muted-foreground">
          Este relatório usa período mensal (mês/ano), diferente do filtro "Período de/até" acima — metas são
          sempre mensais.
        </Text>
        <PeriodSelector
          period={period}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          onCurrent={goToCurrentMonth}
          isCurrent={isCurrentPeriod}
        />
      </div>

      {state === 'loading' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

      {state === 'success' && isSingleView && !singleSummary && (
        <EmptyState
          icon={<Target className="size-6" aria-hidden="true" />}
          title="Nenhum dado para este vendedor"
          description="Selecione outro vendedor ou período."
        />
      )}

      {state === 'success' && isSingleView && singleSummary && (
        <div className="flex flex-col gap-6">
          <GoalSummaryCards summary={singleSummary} />
          <GoalEvolution months={evolution} />
        </div>
      )}

      {state === 'success' && !isSingleView && (
        <div className="flex flex-col gap-6">
          {summaries.length === 0 ? (
            <EmptyState
              icon={<Target className="size-6" aria-hidden="true" />}
              title="Nenhum vendedor cadastrado"
              description="Cadastre vendedores para acompanhar metas por aqui."
            />
          ) : (
            <>
              <GoalTeamSummary items={summaries} />
              <GoalEvolution months={evolution} />
              <Card>
                <CardHeader>
                  <CardTitle>Ranking de vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalRanking items={summaries} onEditGoal={() => navigate(ROUTES.goals)} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {isManager && (
        <Text variant="caption" className="text-muted-foreground">
          Para cadastrar ou editar metas, acesse a página{' '}
          <button type="button" className="text-primary hover:underline" onClick={() => navigate(ROUTES.goals)}>
            Metas
          </button>
          .
        </Text>
      )}
    </div>
  )
}
