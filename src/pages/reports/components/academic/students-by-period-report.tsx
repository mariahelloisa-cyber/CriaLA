import { useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateBr } from '@/utils/format-date'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso } from '@/utils/period'
import { aggregateByPeriod } from '@/services/academic-reports.service'
import type { AcademicEnrollmentRow } from '@/services/academic-reports.service'
import { SimpleBarChart } from '../simple-bar-chart'

const PAGE_SIZE = 10
const CHART_MAX_DAYS = 14

/**
 * "Alunos por Período" (seção 7) — período próprio (De/Até), independente
 * dos filtros estruturais compartilhados (Curso/Turma/Unidade/Categoria
 * continuam se aplicando, via `rows` já filtrado). Mesmo padrão de período
 * local e independente já usado por "Metas x realizado" (Fase 13). Agrupa
 * por `enrollment_date` — decisão documentada em
 * academic-reports.service.ts:aggregateByPeriod.
 */
export function StudentsByPeriodReport({ rows }: { rows: AcademicEnrollmentRow[] }) {
  const [dateFrom, setDateFrom] = useState(firstDayOfPeriodIso(currentPeriod()))
  const [dateTo, setDateTo] = useState(lastDayOfPeriodIso(currentPeriod()))
  const [page, setPage] = useState(1)

  const items = useMemo(() => aggregateByPeriod(rows, dateFrom, dateTo), [rows, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const chartItems = items.slice(-CHART_MAX_DAYS).map((item) => ({
    key: item.date,
    label: formatDateBr(item.date),
    value: item.studentCount,
  }))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-md">
        <DatePicker
          label="Período de"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value)
            setPage(1)
          }}
        />
        <DatePicker
          label="Período até"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => {
            setDateTo(event.target.value)
            setPage(1)
          }}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="size-6" aria-hidden="true" />}
          title="Nenhuma matrícula no período"
          description="Ajuste o período ou os filtros para ver resultados."
        />
      ) : (
        <>
          <SimpleBarChart items={chartItems} formatValue={(value) => `${value} aluno${value === 1 ? '' : 's'}`} />

          <Table wrapperClassName="rounded-none border-0">
            <TableHeader className="bg-transparent">
              <TableRow>
                <TableHead className="uppercase tracking-wide text-caption">Data</TableHead>
                <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => (
                <TableRow key={item.date}>
                  <TableCell className="py-4 text-body">{formatDateBr(item.date)}</TableCell>
                  <TableCell className="py-4 text-body text-muted-foreground">{item.studentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
