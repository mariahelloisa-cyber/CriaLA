import { useCallback, useEffect, useRef, useState } from 'react'
import { getMySellerRank } from '@/services/goals.service'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso } from '@/utils/period'
import type { MyRankSummary } from '@/types/goals'

type LoadState = 'loading' | 'success' | 'error'

/**
 * Fase 19 — "sua posição no ranking", só para quem é de fato vendedor
 * logado (`enabled=false` para gerente, inclusive quando ele filtra a
 * página por um único vendedor: a RPC get_my_seller_rank sempre responde
 * "quem sou eu" via auth.uid(), não aceita um seller_id arbitrário).
 * Período fixo no mês atual — decisão 3 só pede filtro de período para o
 * gerente, não para o vendedor.
 */
export function useMyRank(enabled: boolean) {
  const [data, setData] = useState<MyRankSummary | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const period = currentPeriod()
      const result = await getMySellerRank(firstDayOfPeriodIso(period), lastDayOfPeriodIso(period))
      if (requestId !== requestIdRef.current) return
      setData(result)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar sua posição no ranking.')
      setState('error')
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { data, state, error, retry: load }
}
