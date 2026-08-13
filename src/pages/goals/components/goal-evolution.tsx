import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToBRL } from '@/utils/currency'
import { monthLabel } from '@/utils/period'
import type { MonthlyRealized } from '@/types/goals'

/**
 * "Evolução" simples e legível (seção 16 do prompt): barras horizontais com
 * o valor realizado de cada um dos últimos 6 meses, escaladas pelo maior
 * valor do conjunto. Não é um gráfico de biblioteca externa — o projeto não
 * tem nenhuma dependência de charting, e um gráfico completo seria
 * desproporcional ao pedido ("evolução... de maneira simples"). A janela de
 * 6 meses é uma escolha de implementação (o PDF não define uma janela) —
 * documentada no relatório final.
 */
export function GoalEvolution({ months }: { months: MonthlyRealized[] }) {
  const maxAmount = Math.max(1, ...months.map((m) => m.realizedAmount))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução (últimos {months.length} meses)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {months.map((month) => {
          const widthPercent = Math.max(2, (month.realizedAmount / maxAmount) * 100)
          return (
            <div key={`${month.year}-${month.month}`} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-caption text-muted-foreground">
                {monthLabel(month.month).slice(0, 3)}/{String(month.year).slice(2)}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-caption text-foreground">
                {formatCentsToBRL(Math.round(month.realizedAmount * 100))}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
