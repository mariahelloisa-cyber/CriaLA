import { useCallback, useEffect, useRef, useState } from 'react'
import {
  countActiveEnrollments,
  countEnrollments,
  listStudentCountByCategory,
  listUpcomingGraduations,
} from '@/services/dashboard.service'
import type { ManagerAcademicSnapshot } from '@/types/dashboard'

type LoadState = 'loading' | 'success' | 'error'

const EMPTY: ManagerAcademicSnapshot = {
  totalEnrollments: 0,
  activeEnrollments: 0,
  sellerCount: 0,
  upcomingGraduations: [],
  studentsByCategory: [],
}

/**
 * Só chamado para o gerente (o vendedor não tem nenhum desses indicadores no
 * PDF) — 4 queries leves e independentes, sem N+1 (nenhuma delas é "uma
 * query por categoria/vendedor/matrícula"). `sellerCount` é passado pelo
 * chamador (reaproveita listSellers() já carregado por useScopedSellers,
 * evitando uma 5ª query aqui).
 */
export function useManagerAcademicSnapshot(enabled: boolean, sellerCount: number) {
  const [data, setData] = useState<ManagerAcademicSnapshot>(EMPTY)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const [totalEnrollments, activeEnrollments, upcomingGraduations, studentsByCategory] = await Promise.all([
        countEnrollments(),
        countActiveEnrollments(),
        listUpcomingGraduations(),
        listStudentCountByCategory(),
      ])
      if (requestId !== requestIdRef.current) return
      setData({ totalEnrollments, activeEnrollments, sellerCount, upcomingGraduations, studentsByCategory })
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os indicadores acadêmicos.')
      setState('error')
    }
  }, [enabled, sellerCount])

  useEffect(() => {
    void load()
  }, [load])

  return { data, state, error, retry: load }
}
