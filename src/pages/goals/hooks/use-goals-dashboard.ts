import { useCallback, useEffect, useRef, useState } from 'react'
import { listSales } from '@/services/sales.service'
import { DEFAULT_SALE_FILTERS } from '@/pages/sales/hooks/use-sales-list'
import { listMonthlyEvolution, listSellerGoalSummaries } from '@/services/goals.service'
import { firstDayOfPeriodIso, lastDayOfPeriodIso, periodsBack } from '@/utils/period'
import type { Period } from '@/utils/period'
import type { MonthlyRealized, SellerGoalSummary, SellerOption } from '@/types/goals'
import type { SaleListItem } from '@/types/sales'

type LoadState = 'loading' | 'success' | 'error'

interface UseGoalsDashboardArgs {
  period: Period
  sellers: SellerOption[]
  /** Restringe a um único vendedor (visão do próprio vendedor, ou filtro do gerente). undefined = visão de equipe. */
  sellerId?: string
  /** Evita disparar antes de `sellers` estar pronto (ex.: aguardando listSellers() do gerente). */
  enabled?: boolean
}

/**
 * Um único hook cobre tanto a visão de equipe do gerente (sellers = todos,
 * sellerId = undefined) quanto a visão de um vendedor específico (seller
 * logado, ou gerente filtrando por vendedor) — a diferença é só o tamanho de
 * `sellers` e a presença de `sellerId`. Evita duplicar a lógica de
 * carregamento em dois hooks.
 */
export function useGoalsDashboard({ period, sellers, sellerId, enabled = true }: UseGoalsDashboardArgs) {
  const [summaries, setSummaries] = useState<SellerGoalSummary[]>([])
  const [evolution, setEvolution] = useState<MonthlyRealized[]>([])
  const [recentSales, setRecentSales] = useState<SaleListItem[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const evolutionPeriods = periodsBack(period, 6)
      const [summaryData, evolutionData, salesData] = await Promise.all([
        listSellerGoalSummaries(period, sellers, sellerId),
        listMonthlyEvolution(evolutionPeriods, sellerId),
        // "Vendas que compõem o realizado" só faz sentido para um único vendedor.
        sellerId
          ? listSales({
              ...DEFAULT_SALE_FILTERS,
              sellerId,
              saleDateFrom: firstDayOfPeriodIso(period),
              saleDateTo: lastDayOfPeriodIso(period),
              pageSize: 5,
            })
          : Promise.resolve(null),
      ])
      if (requestId !== requestIdRef.current) return
      setSummaries(summaryData)
      setEvolution(evolutionData)
      setRecentSales(salesData?.items ?? [])
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados de metas.')
      setState('error')
    }
  }, [period, sellers, sellerId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { summaries, evolution, recentSales, state, error, retry: load }
}
