import { useEffect, useState } from 'react'
import { listCourseCategories, listCourses, listUnits } from '@/services/classes.service'
import type { Course, CourseCategory, Unit } from '@/types/classes'

export interface ClassFilterOptions {
  categories: CourseCategory[]
  courses: Course[]
  units: Unit[]
}

const EMPTY: ClassFilterOptions = { categories: [], courses: [], units: [] }

/** Carrega uma vez as listas usadas nos filtros da listagem (categoria/curso/unidade). */
export function useClassOptions() {
  const [options, setOptions] = useState<ClassFilterOptions>(EMPTY)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [categories, courses, units] = await Promise.all([
          listCourseCategories(),
          listCourses(),
          listUnits(),
        ])
        if (!active) return
        setOptions({ categories, courses, units })
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
  }, [])

  return options
}
