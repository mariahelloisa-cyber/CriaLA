import { useCallback, useEffect, useRef, useState } from 'react'
import { listCourses } from '@/services/courses.service'
import type { CourseFilters, CourseListItem } from '@/types/courses'
import type { PaginatedResult } from '@/types/classes'

export const DEFAULT_COURSE_FILTERS: CourseFilters = {
  search: '',
  status: 'all',
  categoryId: null,
  sortBy: 'recent',
  page: 1,
  pageSize: 10,
}

type LoadState = 'loading' | 'success' | 'error'

export function useCoursesList() {
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_COURSE_FILTERS)
  const [result, setResult] = useState<PaginatedResult<CourseListItem> | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Evita respostas fora de ordem (ex.: filtro trocado rápido demais)
  // sobrescreverem o resultado mais recente.
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(async (nextFilters: CourseFilters) => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listCourses(nextFilters)
      if (requestId !== requestIdRef.current) return
      setResult(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os cursos.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void fetchPage(filters)
  }, [filters, fetchPage])

  const updateFilters = useCallback((patch: Partial<Omit<CourseFilters, 'page' | 'pageSize'>>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_COURSE_FILTERS)
  }, [])

  const retry = useCallback(() => {
    void fetchPage(filters)
  }, [fetchPage, filters])

  const hasActiveFilters = filters.search.trim() !== '' || filters.status !== 'all' || filters.categoryId !== null

  return { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry }
}
