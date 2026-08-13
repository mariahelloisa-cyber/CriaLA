import { useEffect, useState } from 'react'
import { listAllClasses, listCourseCategories, listCourses, listUnits } from '@/services/students.service'
import type { ClassOption, Course, CourseCategory, Unit } from '@/types/classes'

export interface AcademicFilterOptions {
  courses: Course[]
  classes: ClassOption[]
  units: Unit[]
  categories: CourseCategory[]
}

const EMPTY: AcademicFilterOptions = { courses: [], classes: [], units: [], categories: [] }

/**
 * Opções dos filtros da seção acadêmica de Relatórios — 4 funções já
 * existentes (students.service.ts), nenhuma query nova. Leitura aberta a
 * ambos os papéis (courses_select/units_select/classes_select/
 * course_categories_select são `using(true)` — RLS de catálogo, não de
 * dados pessoais), então não depende de isManager.
 */
export function useAcademicFilterOptions() {
  const [options, setOptions] = useState<AcademicFilterOptions>(EMPTY)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [courses, classes, units, categories] = await Promise.all([
          listCourses(),
          listAllClasses(),
          listUnits(),
          listCourseCategories(),
        ])
        if (!active) return
        setOptions({ courses, classes, units, categories })
      } catch {
        if (active) setOptions(EMPTY)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return options
}
