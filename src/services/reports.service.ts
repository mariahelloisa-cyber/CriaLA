import { supabase } from '@/lib/supabase'
import type {
  CategoryReportItem,
  DailyReportItem,
  PaymentMethodReportItem,
  ReportFilters,
  ReportSaleRow,
  SellerReportItem,
} from '@/types/reports'
import type { SellerOption } from '@/types/goals'
import type { PaymentMethod } from '@/types/sales'

interface PostgrestLikeError {
  message: string
  code?: string
}

function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para visualizar estes dados.')
  }
  return new Error(fallback)
}

/**
 * Query ÚNICA para toda a página de Relatórios: todas as colunas usadas
 * pelos 5 relatórios (por vendedor, por período, forma de pagamento,
 * categoria) vêm da mesma busca em `sales` — as agregações por
 * vendedor/dia/forma de pagamento/categoria são feitas em memória sobre o
 * mesmo array (ver funções `aggregateBy*` abaixo), nunca uma query por
 * segmento. category_id é uma coluna raiz de `courses` (courses.category_id
 * not null — Fase 02), então o filtro `.eq('course.category_id', ...)`
 * funciona no embed sem precisar do truque de ids auxiliares (mesma técnica
 * já usada em students.service.ts para `class.course_id`).
 *
 * Realizado usa sempre goal_amount/goal_student_count (regra da Fase 11,
 * NÃO recalculada aqui) e sale_date (nunca created_at) para o período —
 * exigências explícitas do prompt da Fase 13.
 */
export async function fetchSalesForReport(filters: ReportFilters): Promise<ReportSaleRow[]> {
  let query = supabase
    .from('sales')
    .select(
      `id, seller_id, sale_date, payment_method, goal_amount, goal_student_count, total_amount,
       course:courses!inner(id, category:course_categories(id, name))`,
    )
    .gte('sale_date', filters.dateFrom)
    .lte('sale_date', filters.dateTo)

  if (filters.sellerId) query = query.eq('seller_id', filters.sellerId)
  if (filters.paymentMethod) query = query.eq('payment_method', filters.paymentMethod)
  if (filters.categoryId) query = query.eq('course.category_id', filters.categoryId)

  const { data, error } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados do relatório.')
  }

  return (data ?? []) as unknown as ReportSaleRow[]
}

/**
 * `financialPercent` NÃO é calculado aqui — depende de `goals` (mensal), que
 * só faz sentido comparar quando o intervalo selecionado é um mês cheio (ver
 * utils/period.ts:matchFullMonth). Essa função só soma vendas; o hook da
 * página decide se/como cruzar com metas.
 */
export function aggregateBySeller(rows: ReportSaleRow[], sellers: SellerOption[]): SellerReportItem[] {
  const bySeller = new Map<string, { salesCount: number; amount: number; students: number }>()

  for (const row of rows) {
    const acc = bySeller.get(row.seller_id) ?? { salesCount: 0, amount: 0, students: 0 }
    acc.salesCount += 1
    acc.amount += row.goal_amount
    acc.students += row.goal_student_count
    bySeller.set(row.seller_id, acc)
  }

  return sellers.map((seller) => {
    const acc = bySeller.get(seller.id) ?? { salesCount: 0, amount: 0, students: 0 }
    return { seller, ...acc, financialPercent: null }
  })
}

/** Agrupa por dia (sale_date), em ordem cronológica — nunca por created_at. */
export function aggregateByDay(rows: ReportSaleRow[]): DailyReportItem[] {
  const byDay = new Map<string, { salesCount: number; amount: number; students: number }>()

  for (const row of rows) {
    const acc = byDay.get(row.sale_date) ?? { salesCount: 0, amount: 0, students: 0 }
    acc.salesCount += 1
    acc.amount += row.goal_amount
    acc.students += row.goal_student_count
    byDay.set(row.sale_date, acc)
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, acc]) => ({ date, ...acc }))
}

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'credit_card', 'bank_slip']

/** Sempre retorna as 3 formas de pagamento, mesmo com 0 vendas — evita "buracos" na tabela/gráfico. */
export function aggregateByPaymentMethod(rows: ReportSaleRow[]): PaymentMethodReportItem[] {
  const totalAmount = rows.reduce((sum, row) => sum + row.goal_amount, 0)

  return PAYMENT_METHODS.map((paymentMethod) => {
    const matching = rows.filter((row) => row.payment_method === paymentMethod)
    const amount = matching.reduce((sum, row) => sum + row.goal_amount, 0)
    const totalAmountRaw = matching.reduce((sum, row) => sum + row.total_amount, 0)
    return {
      paymentMethod,
      salesCount: matching.length,
      amount,
      totalAmountRaw,
      percentOfTotal: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }
  })
}

export function aggregateByCategory(rows: ReportSaleRow[]): CategoryReportItem[] {
  const byCategory = new Map<
    string,
    { category: CategoryReportItem['category']; salesCount: number; amount: number; students: number }
  >()

  for (const row of rows) {
    const category = row.course.category
    const key = category?.id ?? 'sem-categoria'
    const acc = byCategory.get(key) ?? { category, salesCount: 0, amount: 0, students: 0 }
    acc.salesCount += 1
    acc.amount += row.goal_amount
    acc.students += row.goal_student_count
    byCategory.set(key, acc)
  }

  return [...byCategory.values()].sort((a, b) => b.amount - a.amount)
}
