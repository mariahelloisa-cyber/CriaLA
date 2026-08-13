interface BarChartItem {
  key: string
  label: string
  value: number
}

/**
 * Barras horizontais simples, mesmo estilo visual do gráfico de evolução da
 * Fase 12 (pages/goals/components/goal-evolution.tsx) — não reaproveitado
 * diretamente de lá para não tocar em arquivos da Fase 12 além do
 * estritamente necessário (a extração de useScopedSellers já foi a mudança
 * mínima necessária). Sem biblioteca de gráficos (projeto não tem
 * nenhuma) — barras de largura proporcional ao maior valor do conjunto,
 * dentro de um container com scroll horizontal próprio (nunca a página
 * inteira, mesmo padrão de tabelas do projeto).
 */
export function SimpleBarChart({ items, formatValue }: { items: BarChartItem[]; formatValue: (value: number) => string }) {
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {items.map((item) => {
        const widthPercent = Math.max(2, (item.value / max) * 100)
        return (
          <div key={item.key} className="flex min-w-[20rem] items-center gap-3">
            <span className="w-24 shrink-0 truncate text-caption text-muted-foreground">{item.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-caption text-foreground">{formatValue(item.value)}</span>
          </div>
        )
      })}
    </div>
  )
}
