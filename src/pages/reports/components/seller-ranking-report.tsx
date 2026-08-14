import { useState } from 'react'
import { Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { GoalRanking } from '@/pages/goals/components/goal-ranking'
import { MyRankCard } from '@/pages/goals/components/my-rank-card'
import { useMyRank } from '@/pages/goals/hooks/use-my-rank'
import { useSellerRanking } from '@/pages/goals/hooks/use-seller-ranking'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso } from '@/utils/period'
import type { SellerOption } from '@/types/goals'

interface SellerRankingReportProps {
  isManager: boolean
  sellers: SellerOption[]
  enabled: boolean
}

/**
 * "Ranking de Vendedores" (PDF seção 8, um dos 6 Relatórios Comerciais) —
 * até a Fase 25 só existia embutido dentro da aba "Metas x realizado"
 * (goals-vs-realized-section.tsx, que continua intocada). Esta aba reaproveita
 * 100% a mesma implementação da Fase 19 usada em /metas: useSellerRanking +
 * GoalRanking (que por sua vez usa rankSellersByValue) — nenhuma fórmula
 * nova, nenhuma query nova além de invocar o hook já existente com seu
 * próprio período (independente do filtro de período do resto de
 * Relatórios, mesma razão de sempre: `goals` é mensal, um intervalo livre
 * arbitrário não mapeia para uma meta sem ambiguidade).
 *
 * Vendedor nunca vê o ranking completo — mesma regra de /metas: só a própria
 * posição, via MyRankCard/useMyRank/get_my_seller_rank (RPC que só devolve
 * dados do próprio auth.uid()).
 */
export function SellerRankingReport({ isManager, sellers, enabled }: SellerRankingReportProps) {
  const navigate = useNavigate()
  const [range, setRange] = useState(() => ({
    from: firstDayOfPeriodIso(currentPeriod()),
    to: lastDayOfPeriodIso(currentPeriod()),
  }))

  const { summaries, state, error, retry } = useSellerRanking(sellers, range.from, range.to, isManager && enabled)
  const { data: myRank, state: myRankState } = useMyRank(!isManager)

  if (!isManager) {
    return (
      <div className="flex flex-col gap-4">
        {myRankState === 'loading' && <CardSkeleton />}
        {myRankState === 'success' && myRank && <MyRankCard data={myRank} />}
        {myRankState === 'success' && !myRank && (
          <EmptyState
            icon={<Target className="size-6" aria-hidden="true" />}
            title="Nenhum dado disponível"
            description="Sua posição no ranking aparecerá aqui assim que houver vendas no mês atual."
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-lg p-4 shadow-md">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-body-sm font-medium text-foreground">Período do ranking</p>
            <p className="text-caption text-muted-foreground">Padrão: mês atual — dia 1 ao último dia</p>
          </div>
          <div className="flex items-end gap-2">
            <DatePicker
              label="De"
              value={range.from}
              onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
            />
            <DatePicker
              label="Até"
              value={range.to}
              min={range.from || undefined}
              onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
            />
          </div>
        </div>
      </Card>

      {state === 'loading' && <CardSkeleton />}
      {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}
      {state === 'success' && summaries.length === 0 && (
        <EmptyState
          icon={<Target className="size-6" aria-hidden="true" />}
          title="Nenhum vendedor cadastrado"
          description="Cadastre vendedores para acompanhar o ranking por aqui."
        />
      )}
      {state === 'success' && summaries.length > 0 && (
        <GoalRanking items={summaries} onEditGoal={() => navigate(ROUTES.goals)} />
      )}
    </div>
  )
}
