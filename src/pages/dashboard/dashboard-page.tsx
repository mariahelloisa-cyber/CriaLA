import { Target } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { useShellUser } from '@/hooks/useShellUser'
import { GoalSummaryCards } from '@/pages/goals/components/goal-summary-cards'
import { PeriodSelector } from '@/pages/goals/components/period-selector'
import { useGoalPeriod } from '@/pages/goals/hooks/use-goal-period'
import { useGoalsDashboard } from '@/pages/goals/hooks/use-goals-dashboard'
import { useScopedSellers } from '@/pages/goals/hooks/use-scoped-sellers'
import { currentPeriod, periodsEqual } from '@/utils/period'
import { EnrollmentsByMonthCard } from './components/enrollments-by-month-card'
import { OverviewStatsCards } from './components/overview-stats-cards'
import { SellerRankingList } from './components/seller-ranking-list'
import { StudentsByCategoryCard } from './components/students-by-category-card'
import { UpcomingGraduationsList } from './components/upcoming-graduations-list'
import { useEnrollmentsByMonth } from './hooks/use-enrollments-by-month'
import { useManagerAcademicSnapshot } from './hooks/use-manager-academic-snapshot'

/**
 * PDF seção 7 ("Dashboard Inicial") — indicadores financeiros/metas/ranking
 * são 100% reaproveitados dos componentes/hooks da Fase 12 (GoalSummaryCards
 * para o vendedor), sem nenhum recálculo. "Ranking pessoal" do vendedor não
 * foi implementado nesta fase — decisão combinada com o usuário: o RLS de
 * sales/goals restringe o vendedor às próprias linhas, então calcular a
 * posição relativa exigiria uma RPC nova (fora do escopo autorizado agora).
 * Ver relatório final.
 *
 * O topo e o ranking do gerente foram redesenhados (pedido do usuário, com
 * referência visual + código de exemplo) para o layout de 4 cards + ranking
 * simplificado (`OverviewStatsCards`/`SellerRankingList`), em vez de
 * `GoalTeamSummary`/`ManagerAcademicCards`/`GoalRanking`. Nenhum desses 3
 * componentes originais foi alterado — todos continuam em uso em
 * goals-page.tsx e reports/goals-vs-realized-section.tsx, só pararam de ser
 * renderizados aqui. Trade-off aceito: o Dashboard perdeu o atalho "Editar
 * meta" que existia no card de ranking (a Visão Geral agora é só leitura
 * nesse ponto) — editar meta continua em /metas.
 *
 * `--background` (tom lavanda, distinto do branco dos cards) começou como um
 * override escopado só nesta página, mas o usuário depois pediu o mesmo tom
 * em todas as páginas — agora é o token global em globals.css, nada
 * page-specific aqui.
 */
export function DashboardPage() {
  const shellUser = useShellUser()
  const { period, goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useGoalPeriod()
  const isCurrentPeriod = periodsEqual(period, currentPeriod())

  const { isManager, sellers, scopedSellers, effectiveSellerId, enabled } = useScopedSellers()

  const {
    summaries,
    state: goalsState,
    error: goalsError,
    retry: retryGoals,
  } = useGoalsDashboard({ period, sellers: scopedSellers, sellerId: effectiveSellerId, enabled })

  const {
    data: academic,
    state: academicState,
    error: academicError,
    retry: retryAcademic,
  } = useManagerAcademicSnapshot(isManager, sellers.length)

  const {
    data: enrollmentsByMonth,
    state: enrollmentsByMonthState,
    error: enrollmentsByMonthError,
    retry: retryEnrollmentsByMonth,
  } = useEnrollmentsByMonth()

  const ownSummary = !isManager ? (summaries[0] ?? null) : null

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Visão geral', href: ROUTES.dashboard }]}>
      <PageHeader
        title="Visão geral"
        description="Painel de indicadores financeiros, de metas e acadêmicos."
        actions={
          <PeriodSelector
            period={period}
            onPrevious={goToPreviousMonth}
            onNext={goToNextMonth}
            onCurrent={goToCurrentMonth}
            isCurrent={isCurrentPeriod}
          />
        }
      />

      <div className="flex flex-col gap-6">
        {goalsState === 'loading' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {goalsState === 'error' && <ErrorState description={goalsError ?? undefined} onRetry={retryGoals} />}

        {goalsState === 'success' && !isManager && !ownSummary && (
          <EmptyState
            icon={<Target className="size-6" aria-hidden="true" />}
            title="Nenhum dado disponível"
            description="Seus indicadores aparecerão aqui assim que houver vendas ou uma meta cadastrada."
          />
        )}

        {goalsState === 'success' && !isManager && ownSummary && <GoalSummaryCards summary={ownSummary} />}

        {goalsState === 'success' && isManager && (
          <div className="flex flex-col gap-6">
            {academicState === 'loading' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}
            {academicState === 'error' && <ErrorState description={academicError ?? undefined} onRetry={retryAcademic} />}
            {academicState === 'success' && <OverviewStatsCards summaries={summaries} academic={academic} />}

            {academicState === 'success' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="rounded-lg shadow-md lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-body">Ranking de vendedores</CardTitle>
                    <CardDescription className="text-caption">Meta x realizado</CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-5">
                    <SellerRankingList items={summaries} />
                  </CardContent>
                </Card>
                <StudentsByCategoryCard items={academic.studentsByCategory} />
              </div>
            )}

            {academicState === 'success' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  {enrollmentsByMonthState === 'loading' && <CardSkeleton />}
                  {enrollmentsByMonthState === 'error' && (
                    <ErrorState description={enrollmentsByMonthError ?? undefined} onRetry={retryEnrollmentsByMonth} />
                  )}
                  {enrollmentsByMonthState === 'success' && <EnrollmentsByMonthCard items={enrollmentsByMonth} />}
                </div>

                <UpcomingGraduationsList items={academic.upcomingGraduations} />
              </div>
            )}
          </div>
        )}

        {goalsState === 'success' && !isManager && (
          <>
            {enrollmentsByMonthState === 'loading' && <CardSkeleton />}
            {enrollmentsByMonthState === 'error' && (
              <ErrorState description={enrollmentsByMonthError ?? undefined} onRetry={retryEnrollmentsByMonth} />
            )}
            {enrollmentsByMonthState === 'success' && <EnrollmentsByMonthCard items={enrollmentsByMonth} />}
          </>
        )}
      </div>
    </AppShell>
  )
}
