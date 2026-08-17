import { useCallback, useEffect, useRef, useState } from 'react'
import { listTeachers } from '@/services/teachers.service'
import type { PaginatedResult } from '@/types/classes'
import type { TeacherFilters, TeacherListItem } from '@/types/teachers'

export const DEFAULT_TEACHER_FILTERS: TeacherFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

type LoadState = 'loading' | 'success' | 'error'

export function useTeachersList() {
  const [filters, setFilters] = useState<TeacherFilters>(DEFAULT_TEACHER_FILTERS)
  const [result, setResult] = useState<PaginatedResult<TeacherListItem> | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  // Evita respostas fora de ordem (ex.: filtro trocado rápido demais)
  // sobrescreverem o resultado mais recente.
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(async (nextFilters: TeacherFilters) => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await listTeachers(nextFilters)
      if (requestId !== requestIdRef.current) return
      setResult(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os professores.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void fetchPage(filters)
  }, [filters, fetchPage])

  const updateFilters = useCallback((patch: Partial<Omit<TeacherFilters, 'page' | 'pageSize'>>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_TEACHER_FILTERS)
  }, [])

  const retry = useCallback(() => {
    void fetchPage(filters)
  }, [fetchPage, filters])

  const hasActiveFilters = filters.search.trim() !== '' || filters.status !== 'all'

  return { filters, updateFilters, setPage, resetFilters, hasActiveFilters, result, state, error, retry }
}
