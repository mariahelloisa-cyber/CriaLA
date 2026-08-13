import { Tag } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCentsToBRL } from '@/utils/currency'
import type { CategoryReportItem } from '@/types/reports'
import { SimpleBarChart } from './simple-bar-chart'

export function CategoryReport({ items }: { items: CategoryReportItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="size-6" aria-hidden="true" />}
        title="Nenhuma venda no período"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  const chartItems = items.map((item) => ({
    key: item.category?.id ?? 'sem-categoria',
    label: item.category?.name ?? 'Sem categoria',
    value: item.amount,
  }))

  return (
    <div className="flex flex-col gap-5">
      <SimpleBarChart items={chartItems} formatValue={(value) => formatCentsToBRL(Math.round(value * 100))} />

      <Table wrapperClassName="rounded-none border-0">
        <TableHeader className="bg-transparent">
          <TableRow>
            <TableHead className="uppercase tracking-wide text-caption">Categoria</TableHead>
            <TableHead className="uppercase tracking-wide text-caption">Vendas</TableHead>
            <TableHead className="uppercase tracking-wide text-caption">Valor comercial</TableHead>
            <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.category?.id ?? 'sem-categoria'}>
              <TableCell className="py-4 text-body font-medium text-foreground">
                {item.category?.name ?? 'Sem categoria'}
              </TableCell>
              <TableCell className="py-4 text-body text-muted-foreground">{item.salesCount}</TableCell>
              <TableCell className="py-4 text-body text-muted-foreground">
                {formatCentsToBRL(Math.round(item.amount * 100))}
              </TableCell>
              <TableCell className="py-4 text-body text-muted-foreground">{item.students}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
