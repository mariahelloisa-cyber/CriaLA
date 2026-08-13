import { Building2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleBarChart } from '../simple-bar-chart'
import type { UnitReportItem } from '@/services/academic-reports.service'

/** "Alunos por Unidade" (Fase 18 — PDF seção 8) — reaproveita SimpleBarChart (Fase 13), sem biblioteca nova. */
export function StudentsByUnitReport({ items }: { items: UnitReportItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="size-6" aria-hidden="true" />}
        title="Nenhuma unidade com alunos"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SimpleBarChart
        items={items.map((item) => ({
          key: item.unitId ?? 'sem-unidade',
          label: item.unitName ?? 'Sem unidade',
          value: item.studentCount,
        }))}
        formatValue={(value) => `${value} aluno${value === 1 ? '' : 's'}`}
      />

      <Table wrapperClassName="rounded-none border-0">
        <TableHeader className="bg-transparent">
          <TableRow>
            <TableHead className="uppercase tracking-wide text-caption">Unidade</TableHead>
            <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.unitId ?? 'sem-unidade'}>
              <TableCell className="py-4 text-body font-medium text-foreground">
                {item.unitName ?? 'Sem unidade'}
              </TableCell>
              <TableCell className="py-4 text-body text-muted-foreground">{item.studentCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
