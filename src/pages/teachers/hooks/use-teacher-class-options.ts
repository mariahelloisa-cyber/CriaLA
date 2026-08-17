import { useEffect, useState } from 'react'
import { listAllClasses } from '@/services/teachers.service'
import type { ClassOption } from '@/types/teachers'

/** Carrega uma vez todas as turmas, para o seletor "Turmas administradas" do formulário de professor. */
export function useTeacherClassOptions() {
  const [classes, setClasses] = useState<ClassOption[]>([])

  useEffect(() => {
    let active = true

    listAllClasses()
      .then((data) => {
        if (active) setClasses(data)
      })
      .catch(() => {
        // Seletor é um recurso auxiliar do formulário — uma falha aqui não deve travar o cadastro.
        if (active) setClasses([])
      })

    return () => {
      active = false
    }
  }, [])

  return { classes }
}
