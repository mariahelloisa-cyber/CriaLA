import type { PaymentMethod } from './sales'
import type { SellerOption } from './goals'

export type { PaymentMethod } from './sales'
export type { SellerOption } from './goals'

export interface ReportFilters {
  dateFrom: string
  dateTo: string
  /** Só usado pelo gerente — RLS já restringe o vendedor às próprias vendas de qualquer forma. */
  sellerId: string | null
  paymentMethod: PaymentMethod | null
  categoryId: string | null
}

/**
 * Uma venda "crua", só com os campos usados para montar os 5 relatórios da
 * Fase 13 — buscada UMA VEZ por conjunto de filtros e reaproveitada por
 * todas as agregações (services/reports.service.ts), nunca uma query por
 * vendedor/dia/categoria/forma de pagamento.
 */
export interface ReportSaleRow {
  id: string
  seller_id: string
  sale_date: string
  payment_method: PaymentMethod
  goal_amount: number
  goal_student_count: number
  total_amount: number
  course: {
    id: string
    category: { id: string; name: string } | null
  }
}

export interface SellerReportItem {
  seller: SellerOption
  salesCount: number
  amount: number
  students: number
  financialPercent: number | null
}

export interface DailyReportItem {
  date: string
  salesCount: number
  amount: number
  students: number
}

export interface PaymentMethodReportItem {
  paymentMethod: PaymentMethod
  salesCount: number
  /** Soma de goal_amount — o indicador comercial oficial (PDF seção 5), nunca total_amount. */
  amount: number
  /** total_amount somado — só para transparência, claramente rotulado como valor bruto na UI. */
  totalAmountRaw: number
  percentOfTotal: number
}

export interface CategoryReportItem {
  category: { id: string; name: string } | null
  salesCount: number
  amount: number
  students: number
}
