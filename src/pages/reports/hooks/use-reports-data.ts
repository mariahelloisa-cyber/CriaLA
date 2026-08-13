import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listGoalsForPeriod } from '@/services/goals.service'
import {
  aggregateByCategory,
  aggregateByDay,
  aggregateByPaymentMethod,
  aggregateBySeller,
  fetchSalesForReport,
} from '@/services/reports.service'
import { matchFullMonth } from '@/utils/period'
import type { Goal, SellerOption } from '@/types/goals'
import type { ReportFilters, ReportSaleRow } from '@/types/reports'

type LoadState = 'loading' | 'success' | 'error'

/**
 * Uma única query de vendas (fetchSalesForReport) alimenta TODAS as
 * agregações (por vendedor/dia/forma de pagamento/categoria) via useMemo —
 * nunca uma query por segmento. `filters` deve ser um objeto de useState
 * genuíno no componente chamador (nunca reconstruído inline a cada render),
 * do contrário a identidade mudaria a cada render e causaria o mesmo loop
 * infinito já corrigido na Fase 12 (ver memória do projeto e
 * use-scoped-sellers.ts).
 */
export function useReportsData(filters: ReportFilters, sellers: SellerOption[]) {
  const [rows, setRows] = useState<ReportSaleRow[]>([])
  const [goalsForMonth, setGoalsForMonth] = useState<Goal[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  // "Percentual da meta, quando aplicável" (seção 3 do prompt): só faz
  // sentido cruzar com `goals` (mensal) quando o intervalo é um mês cheio.
  const fullMonth = useMemo(() => matchFullMonth(filters.dateFrom, filters.dateTo), [filters.dateFrom, filters.dateTo])

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const [salesRows, goalsRows] = await Promise.all([
        fetchSalesForReport(filters),
        fullMonth ? listGoalsForPeriod(fullMonth, filters.sellerId ?? undefined) : Promise.resolve([]),
      ])
      if (requestId !== requestIdRef.current) return
      setRows(salesRows)
      setGoalsForMonth(goalsRows)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os relatórios.')
      setState('error')
    }
  }, [filters, fullMonth])

  useEffect(() => {
    void load()
  }, [load])

  const bySeller = useMemo(() => {
    const base = aggregateBySeller(rows, sellers)
    if (!fullMonth || goalsForMonth.length === 0) return base
    const goalBySeller = new Map(goalsForMonth.map((g) => [g.seller_id, g]))
    return base.map((item) => {
      const goal = goalBySeller.get(item.seller.id)
      if (!goal) return item
      return {
        ...item,
        financialPercent: goal.financial_target > 0 ? (item.amount / goal.financial_target) * 100 : 0,
      }
    })
  }, [rows, sellers, fullMonth, goalsForMonth])

  const byDay = useMemo(() => aggregateByDay(rows), [rows])
  const byPaymentMethod = useMemo(() => aggregateByPaymentMethod(rows), [rows])
  const byCategory = useMemo(() => aggregateByCategory(rows), [rows])

  const summary = useMemo(
    () => ({
      salesCount: rows.length,
      amount: rows.reduce((sum, row) => sum + row.goal_amount, 0),
      students: rows.reduce((sum, row) => sum + row.goal_student_count, 0),
    }),
    [rows],
  )

  return { bySeller, byDay, byPaymentMethod, byCategory, summary, fullMonth, state, error, retry: load }
}
