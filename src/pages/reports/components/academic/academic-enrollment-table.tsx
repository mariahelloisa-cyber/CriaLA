import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateBr } from '@/utils/format-date'
import { EnrollmentStatusBadge } from '@/pages/students/components/status-badges'
import type { AcademicEnrollmentRow } from '@/services/academic-reports.service'

interface AcademicEnrollmentTableProps {
  items: AcademicEnrollmentRow[]
  emptyIcon: ReactNode
  emptyTitle: string
  emptyDescription: string
  /** Coluna de data específica do relatório (matrícula ou previsão de formação) — cada uso decide qual faz sentido. */
  dateColumnLabel: string
  dateValue: (row: AcademicEnrollmentRow) => string | null
}

/**
 * Tabela de listagem compartilhada por Em Formação / Próximas Formaturas /
 * Formados (seções 8, 9 e 10 do prompt) — os 3 relatórios têm exatamente o
 * mesmo formato de linha (aluno/curso/turma/status + uma data específica),
 * só mudam o conjunto de linhas (já filtrado por academic-reports.service.ts)
 * e qual data é relevante mostrar. Um componente só, não três.
 */
export function AcademicEnrollmentTable({
  items,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  dateColumnLabel,
  dateValue,
}: AcademicEnrollmentTableProps) {
  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <Table wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className="uppercase tracking-wide text-caption">Aluno</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Curso</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Turma</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">{dateColumnLabel}</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="py-4 text-body">
              <div className="flex items-center gap-3">
                <Avatar name={row.studentName} size="sm" />
                <span className="font-medium text-foreground">{row.studentName}</span>
              </div>
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{row.courseName ?? '—'}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{row.className}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{formatDateBr(dateValue(row))}</TableCell>
            <TableCell className="py-4">
              <EnrollmentStatusBadge status={row.status} className="rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
