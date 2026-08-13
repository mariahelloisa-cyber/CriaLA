import { useCallback, useEffect, useRef, useState } from 'react'
import { listEnrollmentsByMonth } from '@/services/dashboard.service'
import type { EnrollmentsByMonth } from '@/types/dashboard'

type LoadState = 'loading' | 'success' | 'error'

const MONTHS_BACK = 6

/**
 * Diferente de useManagerAcademicSnapshot, roda para gerente E vendedor —
 * o RLS de `enrollments_select` escopa sozinho quem vê o quê, então não há
 * gate de `isManager` aqui (decisão combinada com o usuário).
 */
export function useEnrollmentsByMonth() {
  const [data, setData] = useState<EnrollmentsByMonth[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const result = await listEnrollmentsByMonth(MONTHS_BACK)
      if (requestId !== requestIdRef.current) return
      setData(result)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as matrículas por mês.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, state, error, retry: load }
}
