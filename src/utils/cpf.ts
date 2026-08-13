export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Formata para exibição: 000.000.000-00. Aceita entrada parcial (form em digitação). */
export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
  let formatted = parts.join('.')
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`
  return formatted
}

/**
 * Validação real do dígito verificador de CPF (não apenas formato/tamanho).
 * Referência: algoritmo oficial da Receita Federal.
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const calcCheckDigit = (base: string): number => {
    let total = 0
    let factor = base.length + 1
    for (const char of base) {
      total += Number(char) * factor
      factor -= 1
    }
    const remainder = (total * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const base9 = digits.slice(0, 9)
  const dv1 = calcCheckDigit(base9)
  const dv2 = calcCheckDigit(base9 + dv1)

  return digits === base9 + String(dv1) + String(dv2)
}
