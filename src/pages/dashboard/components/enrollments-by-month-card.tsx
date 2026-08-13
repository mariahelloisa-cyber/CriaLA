import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { EnrollmentsByMonth } from '@/types/dashboard'
import { monthShortLabel } from '@/utils/period'
import { MonthlyBarChart } from './monthly-bar-chart'

/**
 * "Matrículas por mês" (pedido do usuário, fora do PDF original) — contagem
 * de registros de `enrollments` por `enrollment_date`, mês a mês, escopada
 * pelo RLS de `enrollments_select` (visível a gerente e vendedor, cada um
 * vendo só o que já podia ver antes). Mesma composição visual de
 * `StudentsByCategoryCard` (`rounded-lg shadow-md`) para os dois cards
 * ficarem coerentes lado a lado na Visão Geral.
 */
export function EnrollmentsByMonthCard({ items }: { items: EnrollmentsByMonth[] }) {
  const chartItems = items.map((item) => ({
    key: `${item.year}-${item.month}`,
    label: monthShortLabel(item.month),
    value: item.count,
  }))

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-body">Matrículas por mês</CardTitle>
        <CardDescription className="text-caption">Volume consolidado</CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-5">
        <MonthlyBarChart items={chartItems} ariaLabel="Matrículas por mês" />
      </CardContent>
    </Card>
  )
}
