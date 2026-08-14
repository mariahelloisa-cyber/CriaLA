import type { Goal } from './goals'

/**
 * Uma linha da listagem de Vendedores (Fase 21). Combina public.profiles
 * (role='seller') com contagens agregadas de students/enrollments e com o
 * mesmo cálculo de meta/ranking já centralizado em goals.service.ts (Fase
 * 19) — nenhuma fórmula financeira nova é criada aqui.
 */
export interface SellerListItem {
  id: string
  full_name: string
  email: string | null
  is_active: boolean
  /** Total de alunos com students.created_by = este vendedor (não filtrado por período — ver relatório final). */
  studentsCount: number
  /** Total de matrículas dos alunos deste vendedor (idem, não filtrado por período). */
  enrollmentsCount: number
  /** Realizado no período selecionado — mesma regra de sales.goal_amount já usada em Metas/Ranking. */
  realizedAmount: number
  realizedStudents: number
  goal: Goal | null
  financialPercent: number
  /** Posição no ranking do período (ver goals.service.ts:rankSellersByValue) — null só se a lista de vendedores estiver vazia. */
  rank: number | null
  totalSellers: number
}

export type SellerStatusFilter = 'all' | 'active' | 'inactive'

export interface SellerFilters {
  search: string
  status: SellerStatusFilter
}

/** Fase 22 — payload enviado para a Edge Function create-seller. */
export interface CreateSellerInput {
  full_name: string
  email: string
  password: string
}

/** Fase 23 — payload enviado para a Edge Function update-seller. */
export interface UpdateSellerInput {
  id: string
  full_name: string
  email: string
}

/** Fase 23 — payload enviado para a Edge Function reset-seller-password. */
export interface ResetSellerPasswordInput {
  id: string
  password: string
}
