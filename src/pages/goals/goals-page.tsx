import { useState } from 'react'
import { Target } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { CardSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { upsertGoal } from '@/services/goals.service'
import { centsToDecimal } from '@/utils/currency'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso, periodsEqual } from '@/utils/period'
import type { SellerOption } from '@/types/goals'
import { GoalEvolution } from './components/goal-evolution'
import { GoalFormDialog } from './components/goal-form-dialog'
import { GoalRanking } from './components/goal-ranking'
import { GoalSummaryCards } from './components/goal-summary-cards'
import { GoalTeamSummary } from './components/goal-team-summary'
import { MyRankCard } from './components/my-rank-card'
import { PeriodSelector } from './components/period-selector'
import { RecentSalesList } from './components/recent-sales-list'
import { useGoalPeriod } from './hooks/use-goal-period'
import { useGoalsDashboard } from './hooks/use-goals-dashboard'
import { useMyRank } from './hooks/use-my-rank'
import { useScopedSellers } from './hooks/use-scoped-sellers'
import { useSellerRanking } from './hooks/use-seller-ranking'

export function GoalsPage() {
  const shellUser = useShellUser()
  const { period, goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useGoalPeriod()
  const isCurrentPeriod = periodsEqual(period, currentPeriod())

  const { isManager, sellers, sellerFilter, setSellerFilter, scopedSellers, effectiveSellerId, enabled, isSingleView } =
    useScopedSellers()

  const { summaries, evolution, recentSales, state, error, retry } = useGoalsDashboard({
    period,
    sellers: scopedSellers,
    sellerId: effectiveSellerId,
    enabled,
  })

  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [goalDialogSeller, setGoalDialogSeller] = useState<SellerOption | null>(null)
  const [savingGoal, setSavingGoal] = useState(false)

  // Ranking (Fase 19): período PRÓPRIO, independente do PeriodSelector do
  // topo — decisão 3 só pede filtro de período para o ranking do gerente,
  // não para o resto da página (metas/evolução continuam mês a mês).
  // Padrão = mês atual (dia 1 ao último dia), igual ao ciclo confirmado.
  const [rankingRange, setRankingRange] = useState(() => ({
    from: firstDayOfPeriodIso(currentPeriod()),
    to: lastDayOfPeriodIso(currentPeriod()),
  }))
  const {
    summaries: rankingSummaries,
    state: rankingState,
    error: rankingError,
    retry: retryRanking,
  } = useSellerRanking(sellers, rankingRange.from, rankingRange.to, isManager && enabled)

  // "Sua posição no ranking" (Fase 19, retomando gap da Fase 14): só para
  // quem é de fato vendedor logado — um gerente filtrando por um único
  // vendedor (isSingleView) não deve chamar isto, a RPC é sempre "quem sou
  // eu" (auth.uid()), não aceita um seller_id arbitrário.
  const { data: myRank, state: myRankState } = useMyRank(!isManager)

  function openGoalDialog(seller: SellerOption) {
    setGoalDialogSeller(seller)
    setGoalDialogOpen(true)
  }

  async function handleSaveGoal(values: { financial_target_cents: number; student_target: number }) {
    if (!goalDialogSeller) return
    setSavingGoal(true)
    try {
      await upsertGoal({
        seller_id: goalDialogSeller.id,
        reference_month: period.month,
        reference_year: period.year,
        financial_target: centsToDecimal(values.financial_target_cents),
        student_target: values.student_target,
      })
      toast({ title: 'Meta salva com sucesso.', variant: 'success' })
      setGoalDialogOpen(false)
      retry()
    } catch (err) {
      toast({
        title: 'Não foi possível salvar a meta.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSavingGoal(false)
    }
  }

  const singleSummary = isSingleView ? (summaries[0] ?? null) : null
  const currentGoalForDialog = goalDialogSeller
    ? (summaries.find((s) => s.seller.id === goalDialogSeller.id)?.goal ?? null)
    : null

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Metas', href: ROUTES.goals }]}>
      <PageHeader
        title="Metas"
        description="Acompanhe metas financeiras e de alunos, período a período."
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

      {isManager && (
        <div className="mb-5 max-w-xs">
          <Select
            label="Vendedor"
            value={sellerFilter ?? ''}
            onChange={(event) => setSellerFilter(event.target.value || null)}
          >
            <option value="">Todos os vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name}
              </option>
            ))}
          </Select>
        </div>
      )}

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
          description="Não há vendedor selecionado ou seus dados ainda não estão disponíveis."
        />
      )}

      {state === 'success' && isSingleView && singleSummary && (
        <div className="flex flex-col gap-6">
          <GoalSummaryCards summary={singleSummary} />
          {!isManager && myRankState === 'success' && myRank && <MyRankCard data={myRank} />}
          {isManager && (
            <div>
              <Button variant="outline" size="sm" onClick={() => openGoalDialog(singleSummary.seller)}>
                <Target className="size-4" aria-hidden="true" />
                {singleSummary.goal ? 'Editar meta' : 'Definir meta'}
              </Button>
            </div>
          )}
          <GoalEvolution months={evolution} />
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-body">Vendas do período</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <RecentSalesList sales={recentSales} />
            </CardContent>
          </Card>
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
              <Card className="rounded-lg shadow-md">
                <CardHeader className="flex-row flex-wrap items-end justify-between gap-4">
                  <div>
                    <CardTitle className="text-body">Ranking de vendedores</CardTitle>
                    <CardDescription className="text-caption">
                      Ordenado pelo valor apurado no período selecionado
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-end gap-2">
                    <DatePicker
                      label="De"
                      value={rankingRange.from}
                      onChange={(event) => setRankingRange((prev) => ({ ...prev, from: event.target.value }))}
                    />
                    <DatePicker
                      label="Até"
                      value={rankingRange.to}
                      min={rankingRange.from || undefined}
                      onChange={(event) => setRankingRange((prev) => ({ ...prev, to: event.target.value }))}
                    />
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5">
                  {rankingState === 'loading' && <CardSkeleton />}
                  {rankingState === 'error' && (
                    <ErrorState description={rankingError ?? undefined} onRetry={retryRanking} />
                  )}
                  {rankingState === 'success' && rankingSummaries.length === 0 && (
                    <EmptyState
                      icon={<Target className="size-6" aria-hidden="true" />}
                      title="Nenhum vendedor cadastrado"
                      description="Cadastre vendedores para acompanhar o ranking por aqui."
                    />
                  )}
                  {rankingState === 'success' && rankingSummaries.length > 0 && (
                    <GoalRanking items={rankingSummaries} onEditGoal={openGoalDialog} />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <GoalFormDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        seller={goalDialogSeller}
        period={period}
        currentGoal={currentGoalForDialog}
        submitting={savingGoal}
        onSubmit={handleSaveGoal}
      />
    </AppShell>
  )
}
