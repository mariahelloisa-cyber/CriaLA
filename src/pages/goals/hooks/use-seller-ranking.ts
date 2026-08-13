import { useCallback, useEffect, useRef, useState } from 'react'
import { listSellerGoalSummariesForRange } from '@/services/goals.service'
import type { SellerGoalSummary, SellerOption } from '@/types/goals'

type LoadState = 'loading' | 'success' | 'error'

/**
 * Fase 19 (Ranking): período PRÓPRIO do ranking do gerente, independente do
 * PeriodSelector do topo da página (decisão 3 só pede filtro de período para
 * o ranking, não para o resto de /metas). Mesmo padrão de
 * request-id/retry/enabled já usado por useGoalsDashboard.
 */
export function useSellerRanking(sellers: SellerOption[], fromIso: string, toIso: string, enabled: boolean) {
  const [summaries, setSummaries] = useState<SellerGoalSummary[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listSellerGoalSummariesForRange(fromIso, toIso, sellers)
      if (requestId !== requestIdRef.current) return
      setSummaries(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o ranking.')
      setState('error')
    }
  }, [sellers, fromIso, toIso, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { summaries, state, error, retry: load }
}
