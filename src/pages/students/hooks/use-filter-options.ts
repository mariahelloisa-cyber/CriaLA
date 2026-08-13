import { useEffect, useState } from 'react'
import { listAllClasses, listCourseCategories, listCourses, listSellers, listUnits } from '@/services/students.service'
import type { ClassOption, Course, CourseCategory, Unit } from '@/types/students'

export interface FilterOptions {
  categories: CourseCategory[]
  courses: Course[]
  classes: ClassOption[]
  units: Unit[]
  sellers: { id: string; full_name: string }[]
}

const EMPTY: FilterOptions = { categories: [], courses: [], classes: [], units: [], sellers: [] }

/** Carrega uma vez as listas usadas nos filtros (categoria/curso/turma/unidade/vendedor). */
export function useFilterOptions(isManager: boolean) {
  const [options, setOptions] = useState<FilterOptions>(EMPTY)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [categories, courses, classes, units, sellers] = await Promise.all([
          listCourseCategories(),
          listCourses(),
          listAllClasses(),
          listUnits(),
          isManager ? listSellers() : Promise.resolve([]),
        ])
        if (!active) return
        setOptions({ categories, courses, classes, units, sellers })
      } catch {
        // Filtros são um recurso auxiliar — uma falha aqui não deve travar a
        // listagem principal, que tem seu próprio ErrorState.
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
