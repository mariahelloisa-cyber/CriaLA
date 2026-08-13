import { useCallback, useEffect, useRef, useState } from 'react'
import { listClasses } from '@/services/classes.service'
import type { ClassFilters, ClassListItem, PaginatedResult } from '@/types/classes'

export const DEFAULT_CLASS_FILTERS: ClassFilters = {
  search: '',
  status: 'all',
  courseId: null,
  unitId: null,
  categoryId: null,
  page: 1,
  pageSize: 10,
}

type LoadState = 'loading' | 'success' | 'error'

export function useClassesList() {
  const [filters, setFilters] = useState<ClassFilters>(DEFAULT_CLASS_FILTERS)
  const [result, setResult] = useState<PaginatedResult<ClassListItem> | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Evita respostas fora de ordem (ex.: filtro trocado rápido demais)
  // sobrescreverem o resultado mais recente.
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(async (nextFilters: ClassFilters) => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listClasses(nextFilters)
      if (requestId !== requestIdRef.current) return
      setResult(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as turmas.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void fetchPage(filters)
  }, [filters, fetchPage])

  const updateFilters = useCallback((patch: Partial<Omit<ClassFilters, 'page' | 'pageSize'>>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_CLASS_FILTERS)
  }, [])

  const retry = useCallback(() => {
    void fetchPage(filters)
  }, [fetchPage, filters])

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.courseId !== null ||
    filters.unitId !== null ||
    filters.categoryId !== null

  return { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry }
}
