import { useEffect, useState } from 'react'
import { listCourseCategories } from '@/services/courses.service'
import type { CourseCategory } from '@/types/courses'

/** Carrega uma vez a lista de categorias usada no filtro e no formulário de curso. */
export function useCourseOptions() {
  const [categories, setCategories] = useState<CourseCategory[]>([])

  useEffect(() => {
    let active = true

    listCourseCategories()
      .then((data) => {
        if (active) setCategories(data)
      })
      .catch(() => {
        // Filtros/formulário são auxiliares — uma falha aqui não deve travar a listagem principal.
        if (active) setCategories([])
      })

    return () => {
      active = false
    }
  }, [])

  return { categories }
}
