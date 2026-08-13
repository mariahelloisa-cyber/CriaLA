import { Badge } from '@/components/ui/badge'
import type { InstallmentStatus, PaymentMethod, SaleSituation } from '@/types/sales'

/**
 * Fonte única de rótulos em português para os enums payment_method e
 * installment_status (mesmo padrão de centralização de ENROLLMENT_STATUS_LABEL
 * em pages/students/components/status-badges.tsx — ver memória da Fase 10).
 */
/** Rótulos ajustados (pedido do usuário, referência visual) — o enum `payment_method` continua com os mesmos 3 valores. */
const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'À Vista',
  credit_card: 'Cartão de Crédito',
  bank_slip: 'Boleto Bancário',
}

const PAYMENT_METHOD_VARIANT: Record<PaymentMethod, 'primary' | 'warning'> = {
  cash: 'primary',
  credit_card: 'primary',
  bank_slip: 'warning',
}

export function PaymentMethodBadge({ method, className }: { method: PaymentMethod; className?: string }) {
  return (
    <Badge variant={PAYMENT_METHOD_VARIANT[method]} className={className}>
      {PAYMENT_METHOD_LABEL[method]}
    </Badge>
  )
}

const INSTALLMENT_STATUS_LABEL: Record<InstallmentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Em atraso',
  cancelled: 'Cancelado',
}

const INSTALLMENT_STATUS_VARIANT: Record<InstallmentStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
}

export function InstallmentStatusBadge({ status }: { status: InstallmentStatus }) {
  return <Badge variant={INSTALLMENT_STATUS_VARIANT[status]}>{INSTALLMENT_STATUS_LABEL[status]}</Badge>
}

/**
 * "Situação" da venda (ver types/sales.ts:SaleSituation) — rótulo e cor
 * reaproveitam o mesmo vocabulário das parcelas, já que é derivada delas.
 */
const SALE_SITUATION_LABEL: Record<SaleSituation, string> = {
  paid: 'Pago',
  overdue: 'Em atraso',
  cancelled: 'Cancelada',
  pending: 'Pendente',
}

const SALE_SITUATION_VARIANT: Record<SaleSituation, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
  pending: 'warning',
}

export function SaleSituationBadge({ situacao }: { situacao: SaleSituation | null }) {
  if (!situacao) return <Badge variant="neutral">—</Badge>
  return <Badge variant={SALE_SITUATION_VARIANT[situacao]}>{SALE_SITUATION_LABEL[situacao]}</Badge>
}

export { PAYMENT_METHOD_LABEL, INSTALLMENT_STATUS_LABEL, SALE_SITUATION_LABEL }
