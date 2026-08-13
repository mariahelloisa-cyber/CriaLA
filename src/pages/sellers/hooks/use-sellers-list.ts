import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listSellersOverview } from '@/services/sellers.service'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso } from '@/utils/period'
import type { SellerFilters, SellerListItem, SellerStatusFilter } from '@/types/sellers'

type LoadState = 'loading' | 'success' | 'error'

export const DEFAULT_SELLER_FILTERS: SellerFilters = { search: '', status: 'all' }

/**
 * Fase 21 — período próprio da página de Vendedores, mesmo padrão já usado
 * pelo card de Ranking em goals-page.tsx (Fase 19): duas datas livres,
 * padrão = mês atual. Busca/status são filtrados no client sobre a lista já
 * carregada — a base de vendedores é pequena (uma equipe comercial, não
 * milhares de linhas), então uma segunda ida ao banco por filtro seria
 * complexidade desnecessária.
 */
export function useSellersList() {
  const [range, setRange] = useState(() => ({
    from: firstDayOfPeriodIso(currentPeriod()),
    to: lastDayOfPeriodIso(currentPeriod()),
  }))
  const [filters, setFilters] = useState<SellerFilters>(DEFAULT_SELLER_FILTERS)
  const [sellers, setSellers] = useState<SellerListItem[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listSellersOverview(range.from, range.to)
      if (requestId !== requestIdRef.current) return
      setSellers(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os vendedores.')
      setState('error')
    }
  }, [range])

  useEffect(() => {
    void load()
  }, [load])

  function updateFilters(patch: Partial<SellerFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function resetFilters() {
    setFilters(DEFAULT_SELLER_FILTERS)
  }

  const hasActiveFilters = filters.search.trim() !== '' || filters.status !== 'all'

  const filteredSellers = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    return sellers.filter((seller) => {
      if (filters.status !== 'all') {
        const wantsActive = filters.status === 'active'
        if (seller.is_active !== wantsActive) return false
      }
      if (term) {
        const matchesName = seller.full_name.toLowerCase().includes(term)
        const matchesEmail = (seller.email ?? '').toLowerCase().includes(term)
        if (!matchesName && !matchesEmail) return false
      }
      return true
    })
  }, [sellers, filters])

  return {
    range,
    setRange,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    sellers: filteredSellers,
    totalUnfiltered: sellers.length,
    state,
    error,
    retry: load,
  }
}

export type { SellerStatusFilter }
