import { useEffect, useState } from 'react'
import { listAllClasses, listCourses, listSellers, listUnits } from '@/services/students.service'
import type { ClassOption, Course, Unit } from '@/types/enrollments'

export interface EnrollmentFilterOptions {
  courses: Course[]
  classes: ClassOption[]
  units: Unit[]
  sellers: { id: string; full_name: string }[]
}

const EMPTY: EnrollmentFilterOptions = { courses: [], classes: [], units: [], sellers: [] }

/**
 * Carrega uma vez as listas usadas nos filtros da listagem (curso/turma/
 * unidade/vendedor). Reaproveita as mesmas funções já usadas pelos filtros
 * do módulo de Alunos (students.service.ts) — mesma fonte de dados, nenhuma
 * consulta nova precisou ser criada para isto.
 */
export function useEnrollmentOptions(isManager: boolean) {
  const [options, setOptions] = useState<EnrollmentFilterOptions>(EMPTY)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [courses, classes, units, sellers] = await Promise.all([
          listCourses(),
          listAllClasses(),
          listUnits(),
          isManager ? listSellers() : Promise.resolve([]),
        ])
        if (!active) return
        setOptions({ courses, classes, units, sellers })
      } catch {
        // Filtros são um recurso auxiliar — uma falha aqui não deve travar a listagem principal.
        if (active) setOptions(EMPTY)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [isManager])

  return options
}
