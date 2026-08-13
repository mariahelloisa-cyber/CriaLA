import { GraduationCap } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClassStatusBadge } from '@/pages/students/components/status-badges'
import type { ClassReportItem } from '@/services/academic-reports.service'

/** "Alunos por Turma" (seção 4) — alunos distintos por turma (ver academic-reports.service.ts:aggregateByClass). */
export function StudentsByClassReport({ items }: { items: ClassReportItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-6" aria-hidden="true" />}
        title="Nenhuma turma com alunos"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  return (
    <Table wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className="uppercase tracking-wide text-caption">Turma</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Curso</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Unidade</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Status da turma</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.classId}>
            <TableCell className="py-4 text-body font-medium text-foreground">{item.className}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.courseName ?? '—'}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.unitName ?? '—'}</TableCell>
            <TableCell className="py-4">
              <ClassStatusBadge status={item.classStatus} className="rounded-full" />
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.studentCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
