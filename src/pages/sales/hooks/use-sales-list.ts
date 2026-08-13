import { useCallback, useEffect, useRef, useState } from 'react'
import { listSales } from '@/services/sales.service'
import type { PaginatedResult, SaleFilters, SaleListItem } from '@/types/sales'

export const DEFAULT_SALE_FILTERS: SaleFilters = {
  search: '',
  paymentMethod: null,
  sellerId: null,
  saleDateFrom: null,
  saleDateTo: null,
  page: 1,
  pageSize: 10,
}

type LoadState = 'loading' | 'success' | 'error'

export function useSalesList() {
  const [filters, setFilters] = useState<SaleFilters>(DEFAULT_SALE_FILTERS)
  const [result, setResult] = useState<PaginatedResult<SaleListItem> | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Evita respostas fora de ordem sobrescreverem o resultado mais recente.
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(async (nextFilters: SaleFilters) => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listSales(nextFilters)
      if (requestId !== requestIdRef.current) return
      setResult(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as vendas.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void fetchPage(filters)
  }, [filters, fetchPage])

  const updateFilters = useCallback((patch: Partial<Omit<SaleFilters, 'page' | 'pageSize'>>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_SALE_FILTERS)
  }, [])

  const retry = useCallback(() => {
    void fetchPage(filters)
  }, [fetchPage, filters])

  const hasActiveFilters = filters.search.trim() !== '' || filters.paymentMethod !== null

  return { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry }
}
