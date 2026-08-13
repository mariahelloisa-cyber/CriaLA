import { useCallback, useEffect, useRef, useState } from 'react'
import { listStudents } from '@/services/students.service'
import type { PaginatedResult, StudentFilters, StudentListItem } from '@/types/students'

export const DEFAULT_STUDENT_FILTERS: StudentFilters = {
  search: '',
  courseId: null,
  categoryId: null,
  classId: null,
  unitId: null,
  enrollmentDateFrom: null,
  enrollmentDateTo: null,
  status: 'all',
  sellerId: null,
  page: 1,
  pageSize: 10,
}

type LoadState = 'loading' | 'success' | 'error'

export function useStudentsList() {
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_STUDENT_FILTERS)
  const [result, setResult] = useState<PaginatedResult<StudentListItem> | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Evita "race condition" de respostas fora de ordem (ex.: filtro trocado
  // rápido demais) sobrescreverem o resultado mais recente.
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(async (nextFilters: StudentFilters) => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listStudents(nextFilters)
      if (requestId !== requestIdRef.current) return
      setResult(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os alunos.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void fetchPage(filters)
  }, [filters, fetchPage])

  const updateFilters = useCallback((patch: Partial<Omit<StudentFilters, 'page' | 'pageSize'>>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_STUDENT_FILTERS)
  }, [])

  const retry = useCallback(() => {
    void fetchPage(filters)
  }, [fetchPage, filters])

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.courseId !== null ||
    filters.categoryId !== null ||
    filters.classId !== null ||
    filters.unitId !== null ||
    filters.enrollmentDateFrom !== null ||
    filters.enrollmentDateTo !== null ||
    filters.status !== 'all' ||
    filters.sellerId !== null

  return { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry }
}
