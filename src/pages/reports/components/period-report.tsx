import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCentsToBRL } from '@/utils/currency'
import { formatDateBr } from '@/utils/format-date'
import type { DailyReportItem } from '@/types/reports'
import { SimpleBarChart } from './simple-bar-chart'

const PAGE_SIZE = 10
/** Barras demais poluiriam o gráfico (seção 12 do prompt: "sem exagerar") — mostra só os últimos 14 dias com venda, a tabela abaixo cobre o intervalo inteiro. */
const CHART_MAX_DAYS = 14

export function PeriodReport({ items }: { items: DailyReportItem[] }) {
  const [page, setPage] = useState(1)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-6" aria-hidden="true" />}
        title="Nenhuma venda no período"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const chartItems = items.slice(-CHART_MAX_DAYS).map((item) => ({
    key: item.date,
    label: formatDateBr(item.date),
    value: item.amount,
  }))

  return (
    <div className="flex flex-col gap-5">
      <SimpleBarChart items={chartItems} formatValue={(value) => formatCentsToBRL(Math.round(value * 100))} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Vendas</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Alunos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((item) => (
            <TableRow key={item.date}>
              <TableCell>{formatDateBr(item.date)}</TableCell>
              <TableCell className="text-muted-foreground">{item.salesCount}</TableCell>
              <TableCell className="text-muted-foreground">{formatCentsToBRL(Math.round(item.amount * 100))}</TableCell>
              <TableCell className="text-muted-foreground">{item.students}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}
