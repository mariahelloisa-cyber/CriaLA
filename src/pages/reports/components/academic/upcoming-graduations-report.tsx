import { CalendarClock } from 'lucide-react'
import { AcademicEnrollmentTable } from './academic-enrollment-table'
import type { AcademicEnrollmentRow } from '@/services/academic-reports.service'

/** "Próximas Formaturas" (seção 9) — matrículas ativas com previsão de formação nos próximos 90 dias (mesma janela do Dashboard, Fase 14). */
export function UpcomingGraduationsReport({ items }: { items: AcademicEnrollmentRow[] }) {
  return (
    <AcademicEnrollmentTable
      items={items}
      emptyIcon={<CalendarClock className="size-6" aria-hidden="true" />}
      emptyTitle="Nenhuma formatura nos próximos 90 dias"
      emptyDescription="Ajuste os filtros para ver resultados."
      dateColumnLabel="Previsão de formação"
      dateValue={(row) => row.expectedGraduationDate}
    />
  )
}
