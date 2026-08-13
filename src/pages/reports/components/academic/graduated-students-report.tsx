import { Award } from 'lucide-react'
import { AcademicEnrollmentTable } from './academic-enrollment-table'
import type { AcademicEnrollmentRow } from '@/services/academic-reports.service'

/**
 * "Alunos Formados" (seção 10) — enrollments.status='completed', o único
 * status explícito de conclusão no schema (rotulado "Formado" em toda a
 * aplicação desde a Fase 07). Nenhuma regra baseada em data foi inventada.
 */
export function GraduatedStudentsReport({ items }: { items: AcademicEnrollmentRow[] }) {
  return (
    <AcademicEnrollmentTable
      items={items}
      emptyIcon={<Award className="size-6" aria-hidden="true" />}
      emptyTitle="Nenhum aluno formado ainda"
      emptyDescription="Ajuste os filtros para ver resultados."
      dateColumnLabel="Previsão de formação"
      dateValue={(row) => row.expectedGraduationDate}
    />
  )
}
