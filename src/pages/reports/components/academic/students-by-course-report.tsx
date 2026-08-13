import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CourseReportItem } from '@/services/academic-reports.service'

/** "Alunos por Curso" (seção 5) — alunos distintos por curso (ver academic-reports.service.ts:aggregateByCourse). */
export function StudentsByCourseReport({ items }: { items: CourseReportItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="size-6" aria-hidden="true" />}
        title="Nenhum curso com alunos"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  return (
    <Table wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className="uppercase tracking-wide text-caption">Curso</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Categoria</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.courseId}>
            <TableCell className="py-4 text-body font-medium text-foreground">{item.courseName}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.categoryName ?? '—'}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.studentCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
