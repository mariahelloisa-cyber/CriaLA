/** Formata uma data ISO (YYYY-MM-DD) para dd/mm/aaaa, sem problemas de fuso
 * horário (não usa `new Date(iso)` diretamente, que interpretaria a data
 * como UTC meia-noite e poderia exibir o dia anterior em fusos negativos). */
export function formatDateBr(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return '—'
  return `${day}/${month}/${year}`
}

export function formatDateTimeBr(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Soma `months` meses a uma data ISO (YYYY-MM-DD), sem passar por fuso
 * horário (mesmo cuidado de formatDateBr — não usa `new Date(iso)` puro).
 * Usada para o vencimento das parcelas: como o PDF não define regra de
 * vencimento, a implementação conservadora adotada (Fase 11) é mensal, a
 * partir da data da venda.
 */
export function addMonthsIso(iso: string, months: number): string {
  const parts = iso.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  const date = new Date(Date.UTC(year, month - 1 + months, day))
  return date.toISOString().slice(0, 10)
}
