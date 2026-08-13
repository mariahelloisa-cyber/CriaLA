/**
 * Toda a matemática de parcelamento é feita em centavos inteiros (never
 * floats) para evitar erros de arredondamento de ponto flutuante — só se
 * converte para número decimal (reais) no limite com o banco (colunas
 * numeric(12,2)).
 */

/** "150000" (dígitos puros, como o usuário digita) -> 150000 centavos = R$ 1.500,00. */
export function digitsToCents(digits: string): number {
  const onlyDigits = digits.replace(/\D/g, '')
  if (!onlyDigits) return 0
  return Number.parseInt(onlyDigits, 10)
}

export function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100
}

export function decimalToCents(value: number): number {
  return Math.round(value * 100)
}

export function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Divide totalCents em `count` parcelas inteiras (centavos) sem perder
 * centavo nenhum por arredondamento. O resto da divisão inteira é distribuído
 * às primeiras parcelas, uma a uma — mesmo critério do exemplo do PDF/prompt
 * (R$ 1.000,00 / 3 = R$ 333,34 + R$ 333,33 + R$ 333,33, com o centavo extra
 * na primeira parcela).
 */
export function splitCentsIntoInstallments(totalCents: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(totalCents / count)
  const remainder = totalCents - base * count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}
