/** Espelha public.goals (supabase/migrations/20260811120400_sales_goals.sql). */
export interface Goal {
  id: string
  seller_id: string
  reference_month: number
  reference_year: number
  financial_target: number
  student_target: number
}

export interface SellerOption {
  id: string
  full_name: string
}

/**
 * Meta + realizado de UM vendedor em UM período, já combinados e com os
 * percentuais/diferenças calculados. `goal: null` significa que não existe
 * linha em `goals` para esse vendedor+período (não é o mesmo que "meta
 * zero" — ver services/goals.service.ts).
 */
export interface SellerGoalSummary {
  seller: SellerOption
  goal: Goal | null
  realizedAmount: number
  realizedStudents: number
  /** 0–100+ (não sofre clamp — ver relatório final, seção J). 0 quando a meta é 0 ou inexistente. */
  financialPercent: number
  studentPercent: number
  /** null quando não há meta cadastrada (não confundir com 0 = meta batida em cheio). */
  financialDiff: number | null
  studentDiff: number | null
}

/** SellerGoalSummary + posição no ranking (ver goals.service.ts:rankSellersByValue). */
export interface RankedSellerSummary extends SellerGoalSummary {
  rank: number
}

/** Retorno de public.get_my_seller_rank — só os números do próprio vendedor chamador, nunca de outros. */
export interface MyRankSummary {
  rank: number
  totalSellers: number
  realizedAmount: number
  realizedStudents: number
}

/** Um ponto da "evolução": total realizado (financeiro/alunos) de um mês. */
export interface MonthlyRealized {
  month: number
  year: number
  realizedAmount: number
  realizedStudents: number
}

export interface UpsertGoalInput {
  seller_id: string
  reference_month: number
  reference_year: number
  financial_target: number
  student_target: number
}

/**
 * Uma venda "crua" de sales, só com os campos usados para apurar
 * realizado/meta — não confundir com SaleListItem (types/sales.ts), que é a
 * listagem completa do módulo de Vendas.
 */
export interface RealizedSaleRow {
  seller_id: string
  sale_date: string
  goal_amount: number
  goal_student_count: number
}
