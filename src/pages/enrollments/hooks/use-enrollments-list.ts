import { useCallback, useEffect, useRef, useState } from 'react'
import { listEnrollments } from '@/services/enrollments.service'
import type { EnrollmentFilters, EnrollmentListItem, PaginatedResult } from '@/types/enrollments'

export const DEFAULT_ENROLLMENT_FILTERS: EnrollmentFilters = {
  search: '',
  status: 'all',
  courseId: null,
  classId: null,
  unitId: null,
  categoryId: null,
  enrollmentDateFrom: null,
  enrollmentDateTo: null,
  sellerId: null,
  sortBy: 'recent',
  page: 1,
  pageSize: 10,
}

type LoadState = 'loading' | 'success' | 'error'

export function useEnrollmentsList() {
  const [filters, setFilters] = useState<EnrollmentFilters>(DEFAULT_ENROLLMENT_FILTERS)
  const [result, setResult] = useState<PaginatedResult<EnrollmentListItem> | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Evita respostas fora de ordem (ex.: filtro trocado rápido demais)
  // sobrescreverem o resultado mais recente.
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(async (nextFilters: EnrollmentFilters) => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listEnrollments(nextFilters)
      if (requestId !== requestIdRef.current) return
      setResult(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as matrículas.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void fetchPage(filters)
  }, [filters, fetchPage])

  const updateFilters = useCallback((patch: Partial<Omit<EnrollmentFilters, 'page' | 'pageSize'>>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_ENROLLMENT_FILTERS)
  }, [])

  const retry = useCallback(() => {
    void fetchPage(filters)
  }, [fetchPage, filters])

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.courseId !== null ||
    filters.classId !== null ||
    filters.unitId !== null ||
    filters.categoryId !== null ||
    filters.enrollmentDateFrom !== null ||
    filters.enrollmentDateTo !== null ||
    filters.sellerId !== null

  return { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry }
}
