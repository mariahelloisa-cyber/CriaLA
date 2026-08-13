/** Formata um contador de indicador com zero à esquerda (ex.: 5 -> "05", 128 -> "128"). */
export function formatMetricValue(value: number) {
  return String(value).padStart(2, '0')
}
