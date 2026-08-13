/**
 * Funções auxiliares de período (mês/ano) para o módulo de Metas —
 * public.goals usa reference_month/reference_year (inteiros), não um range
 * de datas, então essas funções ficam separadas de format-date.ts (que lida
 * com datas ISO). Toda a matemática usa Date.UTC (mesmo cuidado de
 * addMonthsIso em format-date.ts) para nunca sofrer deslocamento de fuso
 * horário.
 */

export interface Period {
  month: number
  year: number
}

export const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const MONTH_LABELS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function monthLabel(month: number): string {
  return MONTH_LABELS[month - 1] ?? String(month)
}

export function monthShortLabel(month: number): string {
  return MONTH_LABELS_SHORT[month - 1] ?? String(month)
}

export function currentPeriod(): Period {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

/** Data ISO do primeiro dia do período (sempre dia 01). */
export function firstDayOfPeriodIso({ month, year }: Period): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/** Data ISO do último dia do período — dia 0 do mês seguinte = último dia do mês atual. */
export function lastDayOfPeriodIso({ month, year }: Period): string {
  const date = new Date(Date.UTC(year, month, 0))
  return date.toISOString().slice(0, 10)
}

/** Desloca um período em `delta` meses (negativo = para trás). */
export function shiftPeriod({ month, year }: Period, delta: number): Period {
  const totalMonths = year * 12 + (month - 1) + delta
  return { year: Math.floor(totalMonths / 12), month: (((totalMonths % 12) + 12) % 12) + 1 }
}

/** Os `count` períodos terminando em `period` (incluindo-o), em ordem cronológica. */
export function periodsBack(period: Period, count: number): Period[] {
  return Array.from({ length: count }, (_, index) => shiftPeriod(period, -(count - 1 - index)))
}

export function periodsEqual(a: Period, b: Period): boolean {
  return a.month === b.month && a.year === b.year
}

/**
 * Retorna o Period correspondente se [fromIso, toIso] for EXATAMENTE um mês
 * inteiro (dia 1 ao último dia do mesmo mês/ano) — null caso contrário.
 * Usada pelo relatório "Vendas por vendedor" (Fase 13) para decidir quando
 * faz sentido comparar o intervalo livre selecionado com uma meta mensal de
 * `goals` ("percentual da meta, quando aplicável" — um intervalo arbitrário
 * não mapeia para nenhuma meta, então a comparação só é válida quando o
 * intervalo é um mês cheio).
 */
export function matchFullMonth(fromIso: string, toIso: string): Period | null {
  const [yearStr, monthStr] = fromIso.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!year || !month) return null
  const period: Period = { month, year }
  if (fromIso === firstDayOfPeriodIso(period) && toIso === lastDayOfPeriodIso(period)) {
    return period
  }
  return null
}
