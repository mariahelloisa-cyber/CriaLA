import { supabase } from '@/lib/supabase'
import { onlyDigits } from '@/utils/cpf'
import type {
  ClassOption,
  Course,
  CourseCategory,
  CreateEnrollmentInput,
  CreateStudentInput,
  PaginatedResult,
  StudentDetail,
  StudentFilters,
  StudentListItem,
  Unit,
  UpdateEnrollmentInput,
  UpdateStudentInput,
} from '@/types/students'

/**
 * students não tem FK direta para classes — a relação acadêmica é sempre via
 * enrollments (decisão da Fase 02, preservada aqui). Por isso a listagem
 * consulta a partir de `enrollments`, não de `students`.
 */
const CLASS_EMBED = `
  id, name, status, start_date, end_date,
  course:courses(id, name, category_id, category:course_categories(id, name, slug)),
  unit:units(id, name)
`

const LIST_SELECT = `
  id, status, enrollment_date, expected_graduation_date,
  student:students!inner(id, full_name, email, cpf, phone, created_by, seller:profiles!created_by(id, full_name)),
  class:classes!inner(${CLASS_EMBED})
`

const DETAIL_SELECT = `
  *,
  enrollments(
    id, student_id, class_id, enrollment_date, expected_graduation_date, status, created_by,
    class:classes(${CLASS_EMBED})
  )
`

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23505') {
    return new Error('Já existe um aluno cadastrado com este CPF.')
  }
  if (error.code === '23514') {
    return new Error('Alguns dados não passaram nas validações do sistema (confira as datas informadas).')
  }
  if (error.code === '23503') {
    return new Error('A turma selecionada não é válida. Atualize a página e tente novamente.')
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

interface ListRow {
  id: string
  status: StudentListItem['enrollmentStatus']
  enrollment_date: string
  expected_graduation_date: string | null
  student: StudentListItem['student']
  class: StudentListItem['class']
}

function mapListRow(row: ListRow): StudentListItem {
  return {
    enrollmentId: row.id,
    enrollmentStatus: row.status,
    enrollmentDate: row.enrollment_date,
    expectedGraduationDate: row.expected_graduation_date,
    student: row.student,
    class: row.class,
  }
}

/**
 * Listagem paginada, server-side, com busca e filtros aplicados no banco
 * (nunca `select * from students` filtrado no navegador). RLS decide quais
 * enrollments cada usuário vê — vendedor só vê as dos seus próprios alunos.
 */
export async function listStudents(filters: StudentFilters): Promise<PaginatedResult<StudentListItem>> {
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
  if (filters.categoryId) {
    query = query.eq('class.course.category_id', filters.categoryId)
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
    // Escapa vírgulas/parênteses, que têm significado especial na sintaxe do .or().
    const term = filters.search.trim().replace(/[%,()]/g, '')
    query = query.or(`full_name.ilike.%${term}%,cpf.ilike.%${term}%,email.ilike.%${term}%`, {
      referencedTable: 'student',
    })
  }

  query = query.order('enrollment_date', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de alunos.')
  }

  const total = count ?? 0
  // supabase-js não tem tipos gerados (Database) para este projeto, então não
  // sabe estaticamente que student/class são relações many-to-one (objeto),
  // não many-to-many (array) — o PostgREST já retorna objeto em runtime. Ver
  // ListRow acima para o formato real.
  const rows = (data ?? []) as unknown as ListRow[]

  return {
    items: rows.map(mapListRow),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function getStudentById(id: string): Promise<StudentDetail | null> {
  const { data, error } = await supabase.from('students').select(DETAIL_SELECT).eq('id', id).maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados do aluno.')
  }

  return data as unknown as StudentDetail | null
}

/**
 * Cria aluno + matrícula atomicamente via RPC (public.create_student_with_enrollment).
 * Ver supabase/migrations/20260812090000_enrollments_expected_graduation_date.sql
 * para o motivo de não fazer dois INSERTs separados aqui.
 *
 * `sellerId` (opcional) permite ao gerente atribuir o cadastro a outro
 * vendedor — ver supabase/migrations/20260817140000_manager_seller_override.sql.
 * Ignorado pela função no banco se quem chama não for gerente.
 */
export async function createStudentWithEnrollment(
  student: CreateStudentInput,
  enrollment: CreateEnrollmentInput,
  sellerId?: string,
): Promise<{ studentId: string; enrollmentId: string }> {
  const normalizedStudent: CreateStudentInput = {
    ...student,
    cpf: student.cpf ? onlyDigits(student.cpf) : student.cpf,
  }

  const { data, error } = await supabase.rpc('create_student_with_enrollment', {
    p_student: normalizedStudent,
    p_enrollment: enrollment,
    p_seller_id: sellerId || null,
  })

  if (error) {
    throw mapError(error, 'Não foi possível cadastrar o aluno. Tente novamente.')
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    throw new Error('Não foi possível cadastrar o aluno. Tente novamente.')
  }

  return { studentId: row.student_id, enrollmentId: row.enrollment_id }
}

export async function updateStudent(id: string, input: UpdateStudentInput): Promise<void> {
  const normalized: UpdateStudentInput = {
    ...input,
    cpf: input.cpf ? onlyDigits(input.cpf) : input.cpf,
  }

  const { error } = await supabase.from('students').update(normalized).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações do aluno.')
  }
}

/**
 * Só managers têm policy de UPDATE em enrollments (RLS enrollments_update_manager
 * — o PDF não concede a vendedores permissão de editar matrícula). Chamar isto
 * como seller falha silenciosamente (RLS filtra, 0 linhas afetadas) — a UI deve
 * simplesmente não oferecer esta ação para sellers, não confiar só nisto.
 */
export async function updateEnrollment(id: string, input: UpdateEnrollmentInput): Promise<void> {
  const { error } = await supabase.from('enrollments').update(input).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações da matrícula.')
  }
}

/** Só managers têm policy de DELETE em students. */
export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir o aluno.')
  }
}

/** Turmas elegíveis para nova matrícula (abertas ou em andamento). */
export async function listAvailableClasses(): Promise<ClassOption[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_EMBED)
    .in('status', ['open', 'in_progress'])
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas disponíveis.')
  }

  return (data ?? []) as unknown as ClassOption[]
}

/** Todas as turmas (para o filtro da listagem, que também busca histórico). */
export async function listAllClasses(): Promise<ClassOption[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_EMBED)
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas.')
  }

  return (data ?? []) as unknown as ClassOption[]
}

export async function listCourseCategories(): Promise<CourseCategory[]> {
  const { data, error } = await supabase
    .from('course_categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as categorias de curso.')
  }

  return data ?? []
}

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, category:course_categories(id, name, slug)')
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar os cursos.')
  }

  return (data ?? []) as unknown as Course[]
}

export async function listUnits(): Promise<Unit[]> {
  const { data, error } = await supabase.from('units').select('id, name').order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as unidades.')
  }

  return data ?? []
}

/** Só usado pelo filtro de vendedor, exibido apenas para managers. */
export async function listSellers(): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'seller')
    .order('full_name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de vendedores.')
  }

  return data ?? []
}

/**
 * Checagem de duplicidade de CPF: aviso, não bloqueio (não há unique
 * constraint no banco — decisão documentada em
 * supabase/migrations/20260811120100_profiles.sql e no relatório desta fase).
 * Sujeita a RLS: um vendedor só enxerga esse aviso para os próprios alunos.
 */
export async function findStudentsByCpf(cpf: string, excludeId?: string): Promise<{ id: string; full_name: string }[]> {
  const normalized = onlyDigits(cpf)
  if (normalized.length !== 11) return []

  let query = supabase.from('students').select('id, full_name').eq('cpf', normalized)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw mapError(error, 'Não foi possível verificar duplicidade de CPF.')
  }

  return data ?? []
}

export interface StudentSaleSummary {
  id: string
  total_amount: number
  payment_method: string
  sale_date: string
}

/**
 * Leitura auxiliar só para o resumo comercial da página de detalhe do aluno.
 * Não é um serviço de vendas completo (isso fica para o módulo de Vendas). O
 * PDF prevê "toda matrícula gera venda automaticamente", mas essa automação
 * ainda não existe — então, hoje, esta consulta normalmente retorna vazio.
 * RLS (sales_select) já garante que um vendedor só veria vendas próprias.
 */
export async function listSalesForStudent(studentId: string): Promise<StudentSaleSummary[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total_amount, payment_method, sale_date')
    .eq('student_id', studentId)
    .order('sale_date', { ascending: false })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as informações comerciais.')
  }

  return data ?? []
}
