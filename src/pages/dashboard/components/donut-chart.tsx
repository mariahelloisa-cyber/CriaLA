interface DonutChartItem {
  key: string
  value: number
  color: string
}

interface DonutChartProps {
  items: DonutChartItem[]
  size?: number
  thickness?: number
  /** Rótulo acessível único — a leitura real dos dados fica a cargo da legenda (texto), não do SVG. */
  ariaLabel: string
}

/**
 * Donut chart genérico, em SVG puro (nenhuma biblioteca de gráficos no
 * projeto — mesma decisão já tomada para SimpleBarChart na Fase 13).
 * Técnica clássica de círculos concêntricos com `stroke-dasharray`/
 * `stroke-dashoffset`, girados -90° para começar às 12h. Cada segmento tem
 * as pontas arredondadas (`strokeLinecap="round"`) e um pequeno espaço em
 * relação ao próximo, para nunca precisar de rótulo dentro do anel.
 * Puramente decorativo/redundante com a legenda (que carrega o dado real em
 * texto) — por isso `aria-hidden`, evitando leitura duplicada por leitor de
 * tela.
 */
export function DonutChart({ items, size = 200, thickness = 32, ariaLabel }: DonutChartProps) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1
  const GAP = 6

  let cumulative = 0

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel}
      className="mx-auto"
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`} aria-hidden="true">
        {items.map((item) => {
          const raw = (item.value / total) * circumference
          const gap = items.length > 1 ? Math.min(GAP, raw * 0.3) : 0
          const drawn = Math.max(raw - gap, 0)
          const offset = -(cumulative + gap / 2)
          cumulative += raw

          return (
            <circle
              key={item.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              strokeDasharray={`${drawn} ${circumference - drawn}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          )
        })}
      </g>
    </svg>
  )
}
