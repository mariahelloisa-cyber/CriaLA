import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  aggregateByCategory,
  aggregateByClass,
  aggregateByCourse,
  aggregateByUnit,
  fetchEnrollmentsForAcademicReport,
  filterActiveEnrollments,
  filterGraduatedEnrollments,
  filterUpcomingGraduations,
} from '@/services/academic-reports.service'
import type { AcademicEnrollmentRow, AcademicReportFilters } from '@/services/academic-reports.service'

type LoadState = 'loading' | 'success' | 'error'

/**
 * Uma única query (fetchEnrollmentsForAcademicReport) alimenta os 7
 * relatórios acadêmicos via useMemo — nunca uma query por relatório/turma/
 * curso/categoria. `filters` deve ser um objeto de useState genuíno no
 * componente chamador (nunca reconstruído inline a cada render), mesmo
 * cuidado já documentado em use-reports-data.ts (Fase 13) e
 * use-scoped-sellers.ts (Fase 12) para evitar loop infinito de requisições.
 */
export function useAcademicReportsData(filters: AcademicReportFilters) {
  const [rows, setRows] = useState<AcademicEnrollmentRow[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState('loading')
    setError(null)
    try {
      const data = await fetchEnrollmentsForAcademicReport(filters)
      if (requestId !== requestIdRef.current) return
      setRows(data)
      setState('success')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados acadêmicos.')
      setState('error')
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  const byClass = useMemo(() => aggregateByClass(rows), [rows])
  const byCourse = useMemo(() => aggregateByCourse(rows), [rows])
  const byCategory = useMemo(() => aggregateByCategory(rows), [rows])
  const byUnit = useMemo(() => aggregateByUnit(rows), [rows])
  const inTraining = useMemo(() => filterActiveEnrollments(rows), [rows])
  const upcomingGraduations = useMemo(() => filterUpcomingGraduations(rows), [rows])
  const graduated = useMemo(() => filterGraduatedEnrollments(rows), [rows])

  return {
    rows,
    byClass,
    byCourse,
    byCategory,
    byUnit,
    inTraining,
    upcomingGraduations,
    graduated,
    state,
    error,
    retry: load,
  }
}
