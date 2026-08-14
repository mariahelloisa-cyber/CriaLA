import { supabase } from '@/lib/supabase'
import { firstDayOfPeriodIso, lastDayOfPeriodIso, matchFullMonth } from '@/utils/period'
import type { Period } from '@/utils/period'
import type {
  Goal,
  MonthlyRealized,
  MyRankSummary,
  RankedSellerSummary,
  RealizedSaleRow,
  SellerGoalSummary,
  SellerOption,
  UpsertGoalInput,
} from '@/types/goals'

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23514') {
    return new Error('Os valores informados não passaram nas validações do sistema (confira meta financeira e de alunos).')
  }
  if (error.code === '23503') {
    return new Error('O vendedor selecionado não é válido. Atualize a página e tente novamente.')
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

/**
 * `goals` já tem UNIQUE(seller_id, reference_month, reference_year) — 1 meta
 * por vendedor+período (Fase 02). Consulta direta, sem necessidade de
 * nenhuma técnica de resolução de ids auxiliar (todas as colunas usadas são
 * raiz da própria tabela).
 */
export async function listGoalsForPeriod(period: Period, sellerId?: string): Promise<Goal[]> {
  let query = supabase
    .from('goals')
    .select('id, seller_id, reference_month, reference_year, financial_target, student_target')
    .eq('reference_month', period.month)
    .eq('reference_year', period.year)

  if (sellerId) query = query.eq('seller_id', sellerId)

  const { data, error } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar as metas do período.')
  }

  return data ?? []
}

/**
 * Realizado financeiro/alunos NÃO é recalculado aqui a partir de
 * `sales.total_amount` — usa `goal_amount`/`goal_student_count`, já
 * calculados e persistidos pela Fase 11 (regra de apuração do PDF seção 5:
 * à vista/cartão = 100% do valor; boleto = 1ª parcela). A Fase 12 só
 * consome esses campos, nunca reimplementa a regra.
 *
 * Uma única query para o intervalo inteiro (não uma por vendedor/mês) —
 * agregação (soma por vendedor/mês) é feita em memória depois, em
 * `summarizeSellers`/`listMonthlyEvolution`. Considerado usar uma view/RPC
 * de agregação no Postgres (`sum()/group by`), que seria o ideal em maior
 * escala, mas para o volume esperado (vendas de poucos meses, não milhões
 * de linhas) uma migration só para isso não se justificava agora — ver
 * relatório final, seção Y.
 */
export async function listRealizedSalesForRange(
  fromIso: string,
  toIso: string,
  sellerId?: string,
): Promise<RealizedSaleRow[]> {
  let query = supabase
    .from('sales')
    .select('seller_id, sale_date, goal_amount, goal_student_count')
    .gte('sale_date', fromIso)
    .lte('sale_date', toIso)

  if (sellerId) query = query.eq('seller_id', sellerId)

  const { data, error } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar o realizado do período.')
  }

  return data ?? []
}

/**
 * Combina sellers + goals + realized (já carregados) em um resumo por
 * vendedor. Função pura, sem I/O — separada para ser testável/reutilizável
 * sem repetir a lógica de cálculo.
 *
 * Proteção contra meta = 0 (seção 9 do prompt): quando financial_target (ou
 * student_target) é 0 — ou não existe meta —, o percentual é sempre 0, nunca
 * NaN/Infinity. `financialDiff`/`studentDiff` só existem quando HÁ meta
 * cadastrada (`goal !== null`); não fazemos clamp para zero quando a meta é
 * superada — o valor fica negativo de propósito (ver relatório final, seção
 * K), a UI decide como apresentar isso.
 */
export function summarizeSellers(
  sellers: SellerOption[],
  goals: Goal[],
  realized: RealizedSaleRow[],
): SellerGoalSummary[] {
  const goalBySeller = new Map(goals.map((g) => [g.seller_id, g]))
  const realizedBySeller = new Map<string, { amount: number; students: number }>()

  for (const row of realized) {
    const acc = realizedBySeller.get(row.seller_id) ?? { amount: 0, students: 0 }
    acc.amount += row.goal_amount
    acc.students += row.goal_student_count
    realizedBySeller.set(row.seller_id, acc)
  }

  return sellers.map((seller) => {
    const goal = goalBySeller.get(seller.id) ?? null
    const r = realizedBySeller.get(seller.id) ?? { amount: 0, students: 0 }
    const financialTarget = goal?.financial_target ?? 0
    const studentTarget = goal?.student_target ?? 0

    return {
      seller,
      goal,
      realizedAmount: r.amount,
      realizedStudents: r.students,
      financialPercent: financialTarget > 0 ? (r.amount / financialTarget) * 100 : 0,
      studentPercent: studentTarget > 0 ? (r.students / studentTarget) * 100 : 0,
      financialDiff: goal ? financialTarget - r.amount : null,
      studentDiff: goal ? studentTarget - r.students : null,
    }
  })
}

/**
 * Orquestra: carrega metas + realizado do período (2 queries, nunca uma por
 * vendedor) e combina com a lista de vendedores já carregada pelo chamador
 * (reaproveita listSellers() de students.service.ts — nenhuma query nova).
 * `sellerId` restringe tanto a consulta quanto o resultado a um único
 * vendedor (usado no filtro do gerente e na visão do próprio vendedor).
 */
export async function listSellerGoalSummaries(
  period: Period,
  sellers: SellerOption[],
  sellerId?: string,
): Promise<SellerGoalSummary[]> {
  return listSellerGoalSummariesForRange(firstDayOfPeriodIso(period), lastDayOfPeriodIso(period), sellers, sellerId)
}

/**
 * Fase 19 (Ranking): mesma orquestração acima, mas para um intervalo de
 * datas livre (não necessariamente um mês calendário) — usado pelo período
 * personalizado do gerente no ranking. `goals` é mensal por natureza
 * (reference_month/reference_year), então só faz sentido cruzar com metas
 * quando [fromIso, toIso] corresponde EXATAMENTE a um mês cheio (mesma regra
 * já usada pelo relatório "Vendas por vendedor" da Fase 13 — ver
 * utils/period.ts:matchFullMonth). Fora de um mês cheio, `goal` vem sempre
 * null e financialPercent/studentPercent ficam 0 (summarizeSellers já trata
 * isso), sem inventar uma segunda regra de comparação.
 */
export async function listSellerGoalSummariesForRange(
  fromIso: string,
  toIso: string,
  sellers: SellerOption[],
  sellerId?: string,
): Promise<SellerGoalSummary[]> {
  const fullMonth = matchFullMonth(fromIso, toIso)

  const [goals, realized] = await Promise.all([
    fullMonth ? listGoalsForPeriod(fullMonth, sellerId) : Promise.resolve([]),
    listRealizedSalesForRange(fromIso, toIso, sellerId),
  ])

  const scopedSellers = sellerId ? sellers.filter((s) => s.id === sellerId) : sellers
  return summarizeSellers(scopedSellers, goals, realized)
}

/**
 * Ranking do gerente (Fase 19): ordena por valor realizado (não por
 * percentual — regra explícita do usuário, "maior valor primeiro"),
 * calculando a posição de forma determinística. Empate: valor desc, depois
 * nome (localeCompare pt-BR), depois id do vendedor — critério estável e
 * documentado, nunca depende da ordem de chegada dos dados.
 */
export function rankSellersByValue(items: SellerGoalSummary[]): RankedSellerSummary[] {
  const sorted = [...items].sort((a, b) => {
    if (b.realizedAmount !== a.realizedAmount) return b.realizedAmount - a.realizedAmount
    const byName = a.seller.full_name.localeCompare(b.seller.full_name, 'pt-BR')
    if (byName !== 0) return byName
    return a.seller.id.localeCompare(b.seller.id)
  })
  return sorted.map((item, index) => ({ ...item, rank: index + 1 }))
}

/**
 * Posição do PRÓPRIO vendedor no ranking (Fase 19) — via
 * public.get_my_seller_rank (RPC SECURITY DEFINER), única forma correta de
 * um vendedor saber sua posição sem enxergar dados de outros vendedores
 * (sales_select/goals_select restringem sua sessão às próprias linhas; ver
 * comentário da função no banco). RLS não é contornada para o cliente: a
 * função só devolve os números do próprio auth.uid(). Gerente não chama
 * isto — já vê o ranking completo via listSellerGoalSummariesForRange.
 */
export async function getMySellerRank(fromIso: string, toIso: string): Promise<MyRankSummary | null> {
  const { data, error } = await supabase.rpc('get_my_seller_rank', { p_from: fromIso, p_to: toIso })

  if (error) {
    throw mapError(error, 'Não foi possível carregar sua posição no ranking.')
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return {
    rank: row.my_rank,
    totalSellers: row.total_sellers,
    realizedAmount: row.realized_amount,
    realizedStudents: row.realized_students,
  }
}

/**
 * Todas as metas (histórico completo, sem filtro de mês/ano) dos vendedores
 * informados — uma única query, mesmo padrão de "query ampla + agregação em
 * memória" já usado em todo o serviço. `goals` é uma tabela pequena (1 linha
 * por vendedor por mês), então buscar o histórico inteiro de um conjunto de
 * vendedores e filtrar em memória pelos meses de interesse (feito pelo
 * chamador) é mais simples e barato do que uma query por mês.
 */
async function listGoalsForSellers(sellerIds: string[]): Promise<Goal[]> {
  if (sellerIds.length === 0) return []

  const { data, error } = await supabase
    .from('goals')
    .select('id, seller_id, reference_month, reference_year, financial_target, student_target')
    .in('seller_id', sellerIds)

  if (error) {
    throw mapError(error, 'Não foi possível carregar as metas do período.')
  }

  return data ?? []
}

/**
 * Evolução: realizado x meta por mês numa lista de períodos (tipicamente os
 * últimos 6 meses). Duas queries no total (vendas do intervalo + metas dos
 * vendedores do escopo), nunca uma por mês/vendedor — mesmo padrão de
 * `listSellerGoalSummariesForRange`. `sellers` é necessário para a visão de
 * equipe (soma da meta de todos); `sellerId`, quando informado, restringe
 * tanto vendas quanto metas a um único vendedor (mesma regra de
 * `listSellerGoalSummariesForRange`).
 *
 * Percentual usa a MESMA fórmula de `summarizeSellers` (target>0 ?
 * realizado/target*100 : 0) — nenhuma fórmula nova (Fase 23).
 */
export async function listMonthlyEvolution(
  periods: Period[],
  sellers: SellerOption[],
  sellerId?: string,
): Promise<MonthlyRealized[]> {
  if (periods.length === 0) return []

  const from = firstDayOfPeriodIso(periods[0]!)
  const to = lastDayOfPeriodIso(periods[periods.length - 1]!)
  const sellerIds = sellerId ? [sellerId] : sellers.map((s) => s.id)

  const [salesRows, goalRows] = await Promise.all([
    listRealizedSalesForRange(from, to, sellerId),
    listGoalsForSellers(sellerIds),
  ])

  const salesBucket = new Map<string, { amount: number; students: number }>()
  for (const row of salesRows) {
    const key = row.sale_date.slice(0, 7) // "YYYY-MM" — agrupa pela data da venda, nunca por created_at
    const acc = salesBucket.get(key) ?? { amount: 0, students: 0 }
    acc.amount += row.goal_amount
    acc.students += row.goal_student_count
    salesBucket.set(key, acc)
  }

  const goalBucket = new Map<string, { amount: number; students: number }>()
  for (const row of goalRows) {
    const key = `${row.reference_year}-${String(row.reference_month).padStart(2, '0')}`
    const acc = goalBucket.get(key) ?? { amount: 0, students: 0 }
    acc.amount += row.financial_target
    acc.students += row.student_target
    goalBucket.set(key, acc)
  }

  return periods.map((period) => {
    const key = `${period.year}-${String(period.month).padStart(2, '0')}`
    const sales = salesBucket.get(key) ?? { amount: 0, students: 0 }
    const goal = goalBucket.get(key) ?? null

    return {
      month: period.month,
      year: period.year,
      realizedAmount: sales.amount,
      realizedStudents: sales.students,
      goalAmount: goal ? goal.amount : null,
      goalStudentCount: goal ? goal.students : null,
      financialPercent: goal && goal.amount > 0 ? (sales.amount / goal.amount) * 100 : 0,
    }
  })
}

/**
 * Cria ou atualiza a meta de um vendedor no período (constraint UNIQUE faz o
 * upsert resolver automaticamente). RLS (goals_insert_manager/
 * goals_update_manager) já garante que só gerente pode chamar isto — a UI
 * não expõe esta ação para vendedor, mas o banco também bloquearia.
 */
export async function upsertGoal(input: UpsertGoalInput): Promise<void> {
  const { error } = await supabase.from('goals').upsert(input, {
    onConflict: 'seller_id,reference_month,reference_year',
  })

  if (error) {
    throw mapError(error, 'Não foi possível salvar a meta.')
  }
}
