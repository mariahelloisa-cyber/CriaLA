import { supabase } from '@/lib/supabase'
import { updateEnrollment as updateEnrollmentBase } from '@/services/students.service'
import type {
  CreateEnrollmentInput,
  EnrollmentDetail,
  EnrollmentFilters,
  EnrollmentListItem,
  EnrollmentSaleSummary,
  EnrollmentsOverview,
  PaginatedResult,
  StudentOption,
} from '@/types/enrollments'
import type { ClassOption } from '@/types/classes'

/** Reaproveita a mesma função usada pelo módulo de Alunos (o RLS/regra de negócio de update de matrícula é uma coisa só). */
export const updateEnrollment = updateEnrollmentBase

/**
 * students não tem FK direta para classes — a relação acadêmica é sempre via
 * enrollments (decisão da Fase 02). A listagem de Matrículas tem `enrollments`
 * como raiz natural: é a própria entidade sendo gerenciada aqui.
 */
const CLASS_EMBED = `
  id, name, status, start_date, end_date,
  course:courses(id, name, category_id, category:course_categories(id, name, slug)),
  unit:units(id, name)
`

const LIST_SELECT = `
  id, enrollment_date, expected_graduation_date, status,
  student:students!inner(id, full_name, cpf, email, phone, created_by, seller:profiles!created_by(id, full_name)),
  class:classes!inner(${CLASS_EMBED})
`

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23514') {
    return new Error('Alguns dados não passaram nas validações do sistema (confira as datas informadas).')
  }
  if (error.code === '23503') {
    return new Error(
      'Não é possível excluir esta matrícula porque existe uma venda vinculada a ela.',
    )
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

interface ListRow {
  id: string
  enrollment_date: string
  expected_graduation_date: string | null
  status: EnrollmentListItem['status']
  student: EnrollmentListItem['student']
  class: EnrollmentListItem['class']
}

function mapListRow(row: ListRow): EnrollmentListItem {
  return {
    id: row.id,
    enrollmentDate: row.enrollment_date,
    expectedGraduationDate: row.expected_graduation_date,
    status: row.status,
    student: row.student,
    class: row.class,
  }
}

/**
 * Busca server-side por nome/CPF do aluno, nome da turma ou nome do curso.
 * Mesma limitação do PostgREST descoberta nas Fases 08/09: `.or()` não aceita
 * misturar coluna raiz com coluna de embed. Aqui nenhum dos campos buscados é
 * coluna raiz de `enrollments` — todos vêm de relações. Resolvemos os ids
 * primeiro (aluno via nome/cpf; turma via nome própria OU via nome do curso,
 * usando `!inner` no embed para o filtro realmente restringir o resultado) e
 * então filtramos `enrollments` só por colunas raiz (`student_id`/`class_id`).
 */
async function resolveSearchOrClause(term: string): Promise<string | null> {
  const escaped = term.replace(/[%,()]/g, '')
  const pattern = `%${escaped}%`

  const [{ data: studentMatches }, { data: classByName }, { data: classByCourse }] = await Promise.all([
    supabase.from('students').select('id').or(`full_name.ilike.${pattern},cpf.ilike.${pattern}`),
    supabase.from('classes').select('id').ilike('name', pattern),
    supabase.from('classes').select('id, course:courses!inner(name)').ilike('course.name', pattern),
  ])

  const studentIds = (studentMatches ?? []).map((s) => s.id)
  const classIds = [...new Set([...(classByName ?? []).map((c) => c.id), ...(classByCourse ?? []).map((c) => c.id)])]

  const clauses: string[] = []
  if (studentIds.length > 0) clauses.push(`student_id.in.(${studentIds.join(',')})`)
  if (classIds.length > 0) clauses.push(`class_id.in.(${classIds.join(',')})`)

  // Nenhum aluno/turma combina com o termo: força um resultado vazio em vez
  // de devolver a listagem inteira sem filtro nenhum.
  if (clauses.length === 0) return 'student_id.in.(00000000-0000-0000-0000-000000000000)'

  return clauses.join(',')
}

export async function listEnrollments(filters: EnrollmentFilters): Promise<PaginatedResult<EnrollmentListItem>> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('enrollments').select(LIST_SELECT, { count: 'exact' })

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.classId) {
    query = query.eq('class_id', filters.classId)
  }
  if (filters.courseId) {
    query = query.eq('class.course_id', filters.courseId)
  }
  if (filters.unitId) {
    query = query.eq('class.unit_id', filters.unitId)
  }
  if (filters.enrollmentDateFrom) {
    query = query.gte('enrollment_date', filters.enrollmentDateFrom)
  }
  if (filters.enrollmentDateTo) {
    query = query.lte('enrollment_date', filters.enrollmentDateTo)
  }
  if (filters.sellerId) {
    query = query.eq('student.created_by', filters.sellerId)
  }
  if (filters.search.trim()) {
    const orClause = await resolveSearchOrClause(filters.search.trim())
    if (orClause) query = query.or(orClause)
  }

  query =
    filters.sortBy === 'name'
      ? query.order('full_name', { referencedTable: 'student', ascending: true })
      : query.order('enrollment_date', { ascending: false })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de matrículas.')
  }

  const total = count ?? 0
  // supabase-js não tem tipos gerados (Database) para este projeto, então não
  // sabe estaticamente que student/class são relações many-to-one (objeto),
  // não many-to-many (array) — o PostgREST já retorna objeto em runtime.
  const rows = (data ?? []) as unknown as ListRow[]

  return {
    items: rows.map(mapListRow),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

/** Indicadores da listagem de Matrículas — respeita a mesma RLS row-owned da listagem (vendedor só vê as próprias). */
export async function getEnrollmentsOverview(): Promise<EnrollmentsOverview> {
  const [totalRes, activeRes, completedRes, cancelledRes] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ])

  if (totalRes.error) throw mapError(totalRes.error, 'Não foi possível carregar os indicadores de matrículas.')
  if (activeRes.error) throw mapError(activeRes.error, 'Não foi possível carregar os indicadores de matrículas.')
  if (completedRes.error) throw mapError(completedRes.error, 'Não foi possível carregar os indicadores de matrículas.')
  if (cancelledRes.error) throw mapError(cancelledRes.error, 'Não foi possível carregar os indicadores de matrículas.')

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    completed: completedRes.count ?? 0,
    cancelled: cancelledRes.count ?? 0,
  }
}

export async function getEnrollment(id: string): Promise<EnrollmentDetail | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`${LIST_SELECT}, created_at, updated_at`)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados da matrícula.')
  }

  if (!data) return null

  const row = data as unknown as ListRow & { created_at: string; updated_at: string }
  return { ...mapListRow(row), created_at: row.created_at, updated_at: row.updated_at }
}

/**
 * Insert direto (não é o RPC create_student_with_enrollment da Fase 07 — este
 * é o fluxo inverso: o aluno já existe, só a matrícula é nova). RLS
 * (enrollments_insert) exige created_by = auth.uid(); sem default no banco,
 * o chamador precisa fornecer o id do usuário autenticado.
 */
export async function createEnrollment(input: CreateEnrollmentInput): Promise<{ id: string }> {
  const { data, error } = await supabase.from('enrollments').insert(input).select('id').single()

  if (error) {
    throw mapError(error, 'Não foi possível criar a matrícula. Tente novamente.')
  }

  return { id: data.id }
}

/**
 * sales.enrollment_id -> enrollments.id é UNIQUE, sem ON DELETE CASCADE: se
 * existir uma venda vinculada, o Postgres rejeita o DELETE com 23503, que
 * mapError traduz para uma mensagem amigável.
 */
export async function deleteEnrollment(id: string): Promise<void> {
  const { error } = await supabase.from('enrollments').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir a matrícula.')
  }
}

/**
 * Busca de alunos para o seletor do formulário de nova matrícula (nome ou
 * CPF). RLS (students_select) já garante que um vendedor só encontra os
 * próprios alunos.
 */
export async function searchStudentsForEnrollment(term: string): Promise<StudentOption[]> {
  const trimmed = term.trim()
  if (!trimmed) return []

  const escaped = trimmed.replace(/[%,()]/g, '')
  const pattern = `%${escaped}%`

  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, cpf, email')
    .or(`full_name.ilike.${pattern},cpf.ilike.${pattern}`)
    .order('full_name', { ascending: true })
    .limit(20)

  if (error) {
    throw mapError(error, 'Não foi possível buscar alunos.')
  }

  return data ?? []
}

/** Turmas elegíveis (abertas/em andamento) de um curso específico, para nova matrícula. */
export async function listAvailableClassesForCourse(courseId: string): Promise<ClassOption[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_EMBED)
    .eq('course_id', courseId)
    .in('status', ['open', 'in_progress'])
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas deste curso.')
  }

  return (data ?? []) as unknown as ClassOption[]
}

/**
 * Venda vinculada à matrícula, se existir (sales.enrollment_id é UNIQUE).
 * Preparação arquitetural para o futuro módulo comercial — não cria nem
 * infere venda nenhuma, só lê o que já existe. RLS (sales_select) já garante
 * que um vendedor só vê vendas próprias.
 */
export async function getSaleForEnrollment(enrollmentId: string): Promise<EnrollmentSaleSummary | null> {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total_amount, payment_method, sale_date')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar as informações comerciais.')
  }

  return data
}

/**
 * Todas as turmas (qualquer status) de um curso, para edição de matrícula —
 * a turma atual pode já estar encerrada e ainda assim precisa continuar
 * selecionável (mesmo raciocínio de listAllClasses em student-edit-page.tsx).
 */
export async function listAllClassesForCourse(courseId: string): Promise<ClassOption[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_EMBED)
    .eq('course_id', courseId)
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas deste curso.')
  }

  return (data ?? []) as unknown as ClassOption[]
}
