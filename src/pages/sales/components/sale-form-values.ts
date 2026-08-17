import { todayIso } from '@/utils/format-date'
import type { PaymentMethod } from '@/types/sales'

export interface SaleFormValues {
  enrollment_id: string
  total_amount_cents: number
  payment_method: PaymentMethod
  payment_plan: string
  sale_date: string
  installment_count: number
  seller_id: string
}

export const EMPTY_SALE_FORM_VALUES: SaleFormValues = {
  enrollment_id: '',
  total_amount_cents: 0,
  payment_method: 'cash',
  payment_plan: '',
  sale_date: todayIso(),
  installment_count: 1,
  seller_id: '',
}
