interface MonthlyBarChartItem {
  key: string
  label: string
  value: number
}

interface MonthlyBarChartProps {
  items: MonthlyBarChartItem[]
  /** Rótulo acessível único — a leitura real dos dados fica a cargo da lista `sr-only`, não do SVG (mesmo padrão do DonutChart). */
  ariaLabel: string
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 300
const PAD_TOP = 16
const PAD_RIGHT = 8
const PAD_BOTTOM = 28
const PAD_LEFT = 32
const TICK_COUNT = 4

/** Maior "número redondo" (1/2/4/5/10 × 10^n) que cobre `maxValue`, dividido em `TICK_COUNT` marcações — mesma técnica de qualquer lib de gráficos, sem depender de nenhuma. */
function computeTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [0, 1, 2, 3, 4]

  const rawStep = maxValue / TICK_COUNT
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 4 ? 4 : normalized <= 5 ? 5 : 10
  const step = Math.max(1, Math.round(niceNormalized * magnitude))
  const top = Math.ceil(maxValue / step) * step

  const ticks: number[] = []
  for (let value = 0; value <= top; value += step) ticks.push(value)
  return ticks
}

/** Barra com cantos arredondados só no topo (fundo reto) — `rect` com `rx` arredonda os 4 cantos, então o caminho é desenhado manualmente. */
function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height))
  const top = y + height
  return `M${x},${top} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${top} Z`
}

/**
 * Barras verticais, em SVG puro (nenhuma biblioteca de gráficos no projeto —
 * mesma decisão de DonutChart/SimpleBarChart). Diferente de SimpleBarChart
 * (barras horizontais sem eixos, pensado para listas tipo "ranking"), este
 * componente existe porque o layout pedido (eixo Y com marcações, linhas de
 * grade horizontais, eixo X com rótulos de mês) não é algo que dá para
 * encaixar em SimpleBarChart sem quebrar seu contrato/uso atual nos
 * relatórios. `viewBox` fixo + `width: 100%` deixa o gráfico responsivo sem
 * overflow horizontal (mesmo `preserveAspectRatio` padrão de SVG).
 */
export function MonthlyBarChart({ items, ariaLabel }: MonthlyBarChartProps) {
  const maxValue = Math.max(0, ...items.map((item) => item.value))
  const ticks = computeTicks(maxValue)
  const topTick = ticks[ticks.length - 1] ?? 1

  const chartWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT
  const chartHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM
  const slotWidth = items.length > 0 ? chartWidth / items.length : chartWidth
  const barWidth = Math.min(48, slotWidth * 0.46)

  const scaleY = (value: number) => PAD_TOP + chartHeight - (value / topTick) * chartHeight

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        className="mx-auto w-full min-w-[20rem] max-w-2xl"
      >
        <g aria-hidden="true">
          {ticks.map((tick) => {
            const y = scaleY(tick)
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={PAD_LEFT + chartWidth}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {items.map((item, index) => {
            const barHeight = topTick > 0 ? (item.value / topTick) * chartHeight : 0
            const slotX = PAD_LEFT + index * slotWidth
            const barX = slotX + (slotWidth - barWidth) / 2
            const barY = scaleY(item.value)
            const labelY = PAD_TOP + chartHeight + 18

            return (
              <g key={item.key}>
                {barHeight > 0 && (
                  <path d={roundedTopBarPath(barX, barY, barWidth, barHeight, 6)} fill="hsl(var(--primary))" />
                )}
                <text
                  x={slotX + slotWidth / 2}
                  y={labelY}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={12}
                >
                  {item.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.key}>
            {item.label}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  )
}
