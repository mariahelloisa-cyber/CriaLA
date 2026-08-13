import { Tag } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleBarChart } from '../simple-bar-chart'
import type { CategoryReportItem } from '@/services/academic-reports.service'

/** "Alunos por Categoria" (seção 6) — reaproveita SimpleBarChart (Fase 13), sem biblioteca nova. */
export function StudentsByCategoryReport({ items }: { items: CategoryReportItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="size-6" aria-hidden="true" />}
        title="Nenhuma categoria com alunos"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SimpleBarChart
        items={items.map((item) => ({
          key: item.categoryId ?? 'sem-categoria',
          label: item.categoryName ?? 'Sem categoria',
          value: item.studentCount,
        }))}
        formatValue={(value) => `${value} aluno${value === 1 ? '' : 's'}`}
      />

      <Table wrapperClassName="rounded-none border-0">
        <TableHeader className="bg-transparent">
          <TableRow>
            <TableHead className="uppercase tracking-wide text-caption">Categoria</TableHead>
            <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.categoryId ?? 'sem-categoria'}>
              <TableCell className="py-4 text-body font-medium text-foreground">
                {item.categoryName ?? 'Sem categoria'}
              </TableCell>
              <TableCell className="py-4 text-body text-muted-foreground">{item.studentCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
