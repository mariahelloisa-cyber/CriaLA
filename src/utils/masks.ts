import { onlyDigits } from './cpf'

/** (00) 00000-0000 ou (00) 0000-0000, conforme a quantidade de dígitos. */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (rest.length <= 4) return `(${ddd}) ${rest}`
  if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
}

/** 00000-000 */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type Uf = (typeof UF_LIST)[number]

export const BRAZILIAN_STATES: Uf[] = UF_LIST as unknown as Uf[]

export function isValidEmail(value: string): boolean {
  // Verificação pragmática (não RFC 5322 completa) — suficiente para UX de formulário.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
