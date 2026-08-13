import { supabase } from '@/lib/supabase'
import type {
  ClassDetail,
  ClassEnrollmentSummary,
  ClassFilters,
  ClassListItem,
  Course,
  CourseCategory,
  CreateClassInput,
  PaginatedResult,
  Unit,
  UpdateClassInput,
} from '@/types/classes'

/**
 * classes tem FK direta para courses/units (ao contrário de students, que só
 * chega em classes via enrollments) — por isso aqui a listagem consulta a
 * partir de `classes` mesmo.
 */
const CLASS_SELECT = `
  id, name, status, start_date, end_date, capacity,
  course:courses!inner(id, name, category_id, category:course_categories(id, name, slug)),
  unit:units(id, name)
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
    return new Error('Não é possível excluir esta turma porque existem alunos matriculados nela. Altere o status para "Encerrada" em vez de excluir.')
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

/**
 * Busca server-side por nome da turma, do curso ou da unidade. O PostgREST
 * desta versão não aceita combinar coluna raiz (name) com coluna de embed
 * (course.name/unit.name) num único `.or()` — por isso resolvemos os ids de
 * curso/unidade que combinam com o termo em duas consultas leves primeiro, e
 * então filtramos `classes` por `name` OU `course_id in (...)` OU
 * `unit_id in (...)`, tudo em colunas raiz (rápido, sem carregar tudo no
 * cliente).
 */
async function resolveSearchOrClause(term: string): Promise<string> {
  const escaped = term.replace(/[%,()]/g, '')
  const pattern = `%${escaped}%`

  const [{ data: courseMatches }, { data: unitMatches }] = await Promise.all([
    supabase.from('courses').select('id').ilike('name', pattern),
    supabase.from('units').select('id').ilike('name', pattern),
  ])

  const clauses = [`name.ilike.${pattern}`]

  const courseIds = (courseMatches ?? []).map((c) => c.id)
  if (courseIds.length > 0) {
    clauses.push(`course_id.in.(${courseIds.join(',')})`)
  }

  const unitIds = (unitMatches ?? []).map((u) => u.id)
  if (unitIds.length > 0) {
    clauses.push(`unit_id.in.(${unitIds.join(',')})`)
  }

  return clauses.join(',')
}

export async function listClasses(filters: ClassFilters): Promise<PaginatedResult<ClassListItem>> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('classes').select(CLASS_SELECT, { count: 'exact' })

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.courseId) {
    query = query.eq('course_id', filters.courseId)
  }
  if (filters.unitId) {
    query = query.eq('unit_id', filters.unitId)
  }
  if (filters.categoryId) {
    query = query.eq('course.category_id', filters.categoryId)
  }
  if (filters.search.trim()) {
    const orClause = await resolveSearchOrClause(filters.search.trim())
    query = query.or(orClause)
  }

  query = query.order('name', { ascending: true }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de turmas.')
  }

  const total = count ?? 0
  // supabase-js não tem tipos gerados (Database) para este projeto, então não
  // sabe estaticamente que course/unit são relações many-to-one (objeto), não
  // many-to-many (array) — o PostgREST já retorna objeto em runtime.
  const items = (data ?? []) as unknown as ClassListItem[]

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function getClass(id: string): Promise<ClassDetail | null> {
  const { data, error } = await supabase
    .from('classes')
    .select(`${CLASS_SELECT}, created_at, updated_at`)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados da turma.')
  }

  return data as unknown as ClassDetail | null
}

export async function createClass(input: CreateClassInput): Promise<{ id: string }> {
  const { data, error } = await supabase.from('classes').insert(input).select('id').single()

  if (error) {
    throw mapError(error, 'Não foi possível criar a turma. Tente novamente.')
  }

  return { id: data.id }
}

export async function updateClass(id: string, input: UpdateClassInput): Promise<void> {
  const { error } = await supabase.from('classes').update(input).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações da turma.')
  }
}

/**
 * enrollments.class_id -> classes.id não tem ON DELETE CASCADE (decisão da
 * Fase 02): se existirem matrículas para a turma, o Postgres rejeita o DELETE
 * com 23503 (foreign_key_violation), que mapError traduz para uma mensagem
 * amigável. Não fazemos exclusão em cascata manualmente aqui.
 */
export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase.from('classes').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir a turma.')
  }
}

/**
 * Quantidade de matrículas por turma, para o "Ocupação: matriculados/vagas"
 * dos cards da listagem — uma única query trazendo só `class_id` das
 * matrículas dessas turmas, contagem em memória (nunca uma query por
 * card/turma). RLS de `enrollments_select` escopa sozinho quem vê o quê.
 */
export async function countEnrollmentsByClassIds(classIds: string[]): Promise<Record<string, number>> {
  if (classIds.length === 0) return {}

  const { data, error } = await supabase.from('enrollments').select('class_id').in('class_id', classIds)

  if (error) throw mapError(error, 'Não foi possível carregar a ocupação das turmas.')

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as Array<{ class_id: string }>) {
    counts[row.class_id] = (counts[row.class_id] ?? 0) + 1
  }
  return counts
}

/** Todas as categorias (lista fixa e pequena — usada nos filtros da listagem). */
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

/** Todos os cursos (para os filtros da listagem, que também cobre turmas com curso hoje inativo). */
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

/** Cursos ativos (PDF/spec: só cursos ativos podem ser escolhidos ao criar/editar uma turma). */
export async function listActiveCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, category:course_categories(id, name, slug)')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar os cursos.')
  }

  return (data ?? []) as unknown as Course[]
}

/** Todas as unidades (para os filtros da listagem). */
export async function listUnits(): Promise<Unit[]> {
  const { data, error } = await supabase.from('units').select('id, name').order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as unidades.')
  }

  return data ?? []
}

/** Unidades ativas (PDF/spec: só unidades ativas podem ser escolhidas ao criar/editar uma turma). */
export async function listActiveUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as unidades.')
  }

  return data ?? []
}

/**
 * Alunos matriculados na turma, para a seção "Alunos matriculados" do
 * detalhe. Não é um módulo de matrículas — apenas uma leitura auxiliar.
 * RLS (enrollments_select) já garante que um vendedor só vê matrículas dos
 * seus próprios alunos; o gerente vê todas.
 */
export async function listEnrollmentsForClass(classId: string): Promise<ClassEnrollmentSummary[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, status, student:students(id, full_name)')
    .eq('class_id', classId)
    .order('enrollment_date', { ascending: false })

  if (error) {
    throw mapError(error, 'Não foi possível carregar os alunos matriculados nesta turma.')
  }

  interface Row {
    id: string
    status: ClassEnrollmentSummary['status']
    student: { id: string; full_name: string } | null
  }

  const rows = (data ?? []) as unknown as Row[]

  return rows
    .filter((row) => row.student !== null)
    .map((row) => ({
      enrollmentId: row.id,
      status: row.status,
      studentId: row.student!.id,
      studentName: row.student!.full_name,
    }))
}
