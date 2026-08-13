import { supabase } from '@/lib/supabase'
import type {
  CreateEnrollmentWithSaleInput,
  CreateSaleInput,
  EligibleEnrollment,
  InstallmentStatus,
  PaginatedResult,
  SaleDetail,
  SaleFilters,
  SaleListItem,
  SaleSituation,
  UpdateSaleInput,
} from '@/types/sales'

/**
 * Ao contrário de enrollments (que só chega em students/classes por relação),
 * `sales` tem FK direta para students/courses/profiles(seller) — todas as
 * colunas usadas em filtros/busca aqui são colunas raiz de `sales`. Não há a
 * limitação de `.or()` raiz+embed descoberta nas Fases 08/09/10 para esses
 * três campos.
 */
const SALE_SELECT = `
  id, enrollment_id, sale_date, payment_method, payment_plan, total_amount, goal_amount,
  student:students!inner(id, full_name, cpf),
  course:courses!inner(id, name, category:course_categories(id, name, slug)),
  seller:profiles!seller_id(id, full_name)
`

const DETAIL_SELECT = `
  ${SALE_SELECT}, goal_student_count, created_at, updated_at,
  enrollment:enrollments(class:classes(id, name, unit:units(id, name))),
  installments:sale_installments(id, installment_number, amount, due_date, paid_at, status)
`

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23505') {
    return new Error('Esta matrícula já possui uma venda registrada.')
  }
  if (error.code === '23514') {
    return new Error('Alguns dados não passaram nas validações do sistema (confira os valores e datas informados).')
  }
  if (error.code === '23503') {
    return new Error('A matrícula selecionada não é válida. Atualize a página e tente novamente.')
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

interface RawSaleRow {
  id: string
  enrollment_id: string
  sale_date: string
  payment_method: SaleListItem['payment_method']
  payment_plan: string | null
  total_amount: number
  goal_amount: number
  student: SaleListItem['student']
  course: SaleListItem['course']
  seller: SaleListItem['seller']
}

/**
 * `sales` não tem coluna de status própria — só as parcelas têm
 * (installment_status). A "situação" exibida na listagem/detalhe é derivada
 * do conjunto de parcelas de cada venda: paga se todas pagas; em atraso se
 * qualquer uma está vencida; cancelada se todas canceladas; senão pendente.
 * Decisão documentada no relatório final (não há coluna nova/migration para
 * isto — é só uma leitura agregada, client-side, das parcelas já existentes).
 */
/**
 * Fase 19 — parcela "vencida" (overdue) é um status DERIVADO, nunca
 * persistido: nenhum cron/trigger existe (nem foi criado nesta fase) para
 * escrever 'overdue' em sale_installments.status. Mesmo padrão já
 * estabelecido por deriveSaleSituation logo abaixo (situação da venda também
 * é derivada, não armazenada) — aplicamos a mesma filosofia aqui em vez de
 * inventar um mecanismo de escrita novo.
 *
 * Regra confirmada pelo usuário: due_date < hoje AND status not in
 * (paid, cancelled) => 'overdue' para exibição. paid/cancelled sempre vencem
 * (parcela paga depois do vencimento volta a mostrar 'paid', nunca fica
 * "presa" em overdue) — daí o early return abaixo cobrir isso automaticamente,
 * já que só reclassificamos a partir de 'pending'.
 */
export function effectiveInstallmentStatus(installment: {
  status: InstallmentStatus
  due_date: string | null
}): InstallmentStatus {
  if (installment.status !== 'pending' || !installment.due_date) return installment.status
  const today = new Date().toISOString().slice(0, 10)
  return installment.due_date < today ? 'overdue' : installment.status
}

export function deriveSaleSituation(statuses: InstallmentStatus[]): SaleSituation {
  if (statuses.length === 0) return 'pending'
  if (statuses.every((s) => s === 'cancelled')) return 'cancelled'
  if (statuses.some((s) => s === 'overdue')) return 'overdue'
  if (statuses.every((s) => s === 'paid' || s === 'cancelled')) return 'paid'
  return 'pending'
}

/**
 * Busca server-side por aluno (nome/CPF), curso ou vendedor. Diferente da
 * busca de matrículas (Fase 10), aqui os três campos são colunas RAIZ de
 * `sales` (student_id/course_id/seller_id), então o `.or()` final pode
 * combiná-los diretamente sem o truque de resolver ids auxiliares primeiro —
 * só precisamos resolver os ids nas tabelas relacionadas (students/courses/
 * profiles) antes, o que já fazíamos por outro motivo.
 */
async function resolveSearchOrClause(term: string): Promise<string> {
  const escaped = term.replace(/[%,()]/g, '')
  const pattern = `%${escaped}%`

  const [{ data: students }, { data: courses }, { data: sellers }] = await Promise.all([
    supabase.from('students').select('id').or(`full_name.ilike.${pattern},cpf.ilike.${pattern}`),
    supabase.from('courses').select('id').ilike('name', pattern),
    supabase.from('profiles').select('id').ilike('full_name', pattern),
  ])

  const clauses: string[] = []
  if (students && students.length > 0) clauses.push(`student_id.in.(${students.map((s) => s.id).join(',')})`)
  if (courses && courses.length > 0) clauses.push(`course_id.in.(${courses.map((c) => c.id).join(',')})`)
  if (sellers && sellers.length > 0) clauses.push(`seller_id.in.(${sellers.map((s) => s.id).join(',')})`)

  if (clauses.length === 0) return 'student_id.in.(00000000-0000-0000-0000-000000000000)'
  return clauses.join(',')
}

export async function listSales(filters: SaleFilters): Promise<PaginatedResult<SaleListItem>> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('sales').select(SALE_SELECT, { count: 'exact' })

  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod)
  }
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId)
  }
  if (filters.saleDateFrom) {
    query = query.gte('sale_date', filters.saleDateFrom)
  }
  if (filters.saleDateTo) {
    query = query.lte('sale_date', filters.saleDateTo)
  }
  if (filters.search.trim()) {
    const orClause = await resolveSearchOrClause(filters.search.trim())
    query = query.or(orClause)
  }

  query = query.order('sale_date', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de vendas.')
  }

  const rows = (data ?? []) as unknown as RawSaleRow[]
  const saleIds = rows.map((r) => r.id)

  const situacaoBySaleId = new Map<string, SaleSituation>()
  const installmentSummaryBySaleId = new Map<string, { count: number; amount: number }>()
  if (saleIds.length > 0) {
    const { data: installments } = await supabase
      .from('sale_installments')
      .select('sale_id, status, due_date, installment_number, amount')
      .in('sale_id', saleIds)
    const bySale = new Map<string, InstallmentStatus[]>()
    const rowsBySale = new Map<string, { installment_number: number; amount: number }[]>()
    for (const row of installments ?? []) {
      const statusList = bySale.get(row.sale_id) ?? []
      statusList.push(effectiveInstallmentStatus(row))
      bySale.set(row.sale_id, statusList)

      const rowList = rowsBySale.get(row.sale_id) ?? []
      rowList.push({ installment_number: row.installment_number, amount: row.amount })
      rowsBySale.set(row.sale_id, rowList)
    }
    for (const saleId of saleIds) {
      situacaoBySaleId.set(saleId, deriveSaleSituation(bySale.get(saleId) ?? []))

      const saleInstallments = rowsBySale.get(saleId) ?? []
      const first = saleInstallments.find((i) => i.installment_number === 1) ?? saleInstallments[0]
      installmentSummaryBySaleId.set(saleId, { count: saleInstallments.length, amount: first?.amount ?? 0 })
    }
  }

  const total = count ?? 0

  return {
    items: rows.map((row) => ({
      id: row.id,
      enrollment_id: row.enrollment_id,
      sale_date: row.sale_date,
      payment_method: row.payment_method,
      payment_plan: row.payment_plan,
      total_amount: row.total_amount,
      goal_amount: row.goal_amount,
      student: row.student,
      course: row.course,
      seller: row.seller,
      situacao: situacaoBySaleId.get(row.id) ?? null,
      installmentCount: installmentSummaryBySaleId.get(row.id)?.count ?? 0,
      installmentAmount: installmentSummaryBySaleId.get(row.id)?.amount ?? 0,
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export interface SalesSummary {
  count: number
  totalAmount: number
  goalAmount: number
}

/**
 * "Vendas registradas / Valor bruto contratado / Valor apurado em meta" do
 * topo da página — soma sobre TODAS as vendas que passam pelos filtros
 * atuais (busca/forma de pagamento), não só a página atual da paginação.
 * Uma única query trazendo só os 2 valores numéricos (sem embeds, sem
 * paginação), soma em memória — mesmo padrão de agregação client-side já
 * usado em reports.service.ts/dashboard.service.ts, nunca uma query por
 * linha.
 */
export async function getSalesSummary(filters: Pick<SaleFilters, 'search' | 'paymentMethod'>): Promise<SalesSummary> {
  let query = supabase.from('sales').select('total_amount, goal_amount', { count: 'exact' })

  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod)
  }
  if (filters.search.trim()) {
    const orClause = await resolveSearchOrClause(filters.search.trim())
    query = query.or(orClause)
  }

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar o resumo de vendas.')
  }

  const rows = (data ?? []) as Array<{ total_amount: number; goal_amount: number }>

  return {
    count: count ?? 0,
    totalAmount: rows.reduce((sum, row) => sum + row.total_amount, 0),
    goalAmount: rows.reduce((sum, row) => sum + row.goal_amount, 0),
  }
}

interface RawSaleDetailRow extends RawSaleRow {
  goal_student_count: number
  created_at: string
  updated_at: string
  enrollment: { class: SaleDetail['class'] } | null
  installments: SaleDetail['installments']
}

export async function getSale(id: string): Promise<SaleDetail | null> {
  const { data, error } = await supabase.from('sales').select(DETAIL_SELECT).eq('id', id).maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados da venda.')
  }
  if (!data) return null

  const row = data as unknown as RawSaleDetailRow
  return {
    id: row.id,
    enrollment_id: row.enrollment_id,
    sale_date: row.sale_date,
    payment_method: row.payment_method,
    payment_plan: row.payment_plan,
    total_amount: row.total_amount,
    goal_amount: row.goal_amount,
    goal_student_count: row.goal_student_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student: row.student,
    course: row.course,
    seller: row.seller,
    class: row.enrollment?.class ?? null,
    installments: [...row.installments].sort((a, b) => a.installment_number - b.installment_number),
  }
}

/**
 * Matrículas elegíveis para receber uma venda (ainda sem sales.enrollment_id
 * — a coluna é UNIQUE, 1 venda por matrícula). PostgREST não tem um operador
 * direto de "not exists"/"left join is null" utilizável aqui, então
 * resolvemos os ids que JÁ têm venda primeiro e excluímos com `.not(...in...)`
 * — mesma técnica de ids auxiliares das fases anteriores.
 */
export async function searchEligibleEnrollmentsForSale(term: string): Promise<EligibleEnrollment[]> {
  const trimmed = term.trim()
  if (!trimmed) return []

  const { data: sold } = await supabase.from('sales').select('enrollment_id')
  const soldIds = (sold ?? []).map((s) => s.enrollment_id)

  const escaped = trimmed.replace(/[%,()]/g, '')
  const pattern = `%${escaped}%`

  let query = supabase
    .from('enrollments')
    .select(
      `id, enrollment_date,
       student:students!inner(id, full_name, cpf),
       class:classes(id, name, course:courses(id, name), unit:units(id, name))`,
    )
    .or(`full_name.ilike.${pattern},cpf.ilike.${pattern}`, { referencedTable: 'student' })
    .order('enrollment_date', { ascending: false })
    .limit(20)

  if (soldIds.length > 0) {
    query = query.not('id', 'in', `(${soldIds.join(',')})`)
  }

  const { data, error } = await query

  if (error) {
    throw mapError(error, 'Não foi possível buscar matrículas.')
  }

  return (data ?? []) as unknown as EligibleEnrollment[]
}

export async function createSaleWithInstallments(input: CreateSaleInput): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('create_sale_with_installments', {
    p_enrollment_id: input.enrollment_id,
    p_total_amount: input.total_amount,
    p_payment_method: input.payment_method,
    p_payment_plan: input.payment_plan,
    p_sale_date: input.sale_date,
    p_installments: input.installments,
  })

  if (error) {
    throw mapError(error, 'Não foi possível registrar a venda. Tente novamente.')
  }

  return { id: data as string }
}

/**
 * Fase 19, decisão 5: matrícula + venda + parcelas em uma única transação,
 * para um aluno já cadastrado (create_enrollment_with_sale, RPC nova). Não
 * substitui createEnrollment (Fase 10) nem createSaleWithInstallments (Fase
 * 11) — é um TERCEIRO caminho, usado só pelo modo "Nova matrícula" do
 * SaleForm em /vendas/nova (já manager-only por RoleRoute; a própria RLS de
 * sale_installments_insert_manager também garante isso no banco).
 */
export async function createEnrollmentWithSale(
  input: CreateEnrollmentWithSaleInput,
): Promise<{ enrollmentId: string; saleId: string }> {
  const { data, error } = await supabase.rpc('create_enrollment_with_sale', {
    p_student_id: input.student_id,
    p_class_id: input.class_id,
    p_enrollment_date: input.enrollment_date,
    p_expected_graduation_date: input.expected_graduation_date,
    p_total_amount: input.total_amount,
    p_payment_method: input.payment_method,
    p_payment_plan: input.payment_plan,
    p_sale_date: input.sale_date,
    p_installments: input.installments,
  })

  if (error) {
    throw mapError(error, 'Não foi possível registrar a matrícula e a venda. Tente novamente.')
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    throw new Error('Não foi possível registrar a matrícula e a venda. Tente novamente.')
  }

  return { enrollmentId: row.enrollment_id, saleId: row.sale_id }
}

/**
 * Campos editáveis restritos a sale_date/payment_plan (ver
 * types/sales.ts:UpdateSaleInput) — alterar valor/forma de pagamento exigiria
 * recalcular/recriar as parcelas, uma operação que o PDF não especifica e que
 * não foi implementada nesta fase (documentado no relatório final).
 */
export async function updateSale(id: string, input: UpdateSaleInput): Promise<void> {
  const { error } = await supabase.from('sales').update(input).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações da venda.')
  }
}

/** sale_installments tem ON DELETE CASCADE em sale_id, então as parcelas são removidas junto. */
export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from('sales').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir a venda.')
  }
}

/**
 * Transições de status controladas (não é uma edição livre de parcela — ver
 * relatório final, seção AB): só permite marcar como paga (com paid_at =
 * agora) ou cancelada. RLS (sale_installments_update_manager) já garante que
 * só gerente pode chamar isto.
 */
export async function markInstallmentPaid(id: string): Promise<void> {
  const { error } = await supabase
    .from('sale_installments')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível registrar o pagamento da parcela.')
  }
}

export async function cancelInstallment(id: string): Promise<void> {
  const { error } = await supabase
    .from('sale_installments')
    .update({ status: 'cancelled', paid_at: null })
    .eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível cancelar a parcela.')
  }
}
