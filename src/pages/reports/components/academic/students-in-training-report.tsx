import { GraduationCap } from 'lucide-react'
import { AcademicEnrollmentTable } from './academic-enrollment-table'
import type { AcademicEnrollmentRow } from '@/services/academic-reports.service'

/** "Alunos em Formação" (seção 8) — status='active', mesma regra do Dashboard (Fase 14), não recriada aqui. */
export function StudentsInTrainingReport({ items }: { items: AcademicEnrollmentRow[] }) {
  return (
    <AcademicEnrollmentTable
      items={items}
      emptyIcon={<GraduationCap className="size-6" aria-hidden="true" />}
      emptyTitle="Nenhum aluno em formação"
      emptyDescription="Ajuste os filtros para ver resultados."
      dateColumnLabel="Data da matrícula"
      dateValue={(row) => row.enrollmentDate}
    />
  )
}
