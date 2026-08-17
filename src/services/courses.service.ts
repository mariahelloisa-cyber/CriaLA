import { supabase } from '@/lib/supabase'
import { listCourseCategories } from '@/services/classes.service'
import type {
  CourseClassSummary,
  CourseDetail,
  CourseFilters,
  CourseListItem,
  CoursesOverview,
  CreateCourseInput,
  UpdateCourseInput,
} from '@/types/courses'
import type { PaginatedResult } from '@/types/classes'

export { listCourseCategories }

const COURSE_SELECT = `
  id, name, description, is_active, total_units,
  category:course_categories(id, name, slug)
`

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23514') {
    return new Error('Alguns dados não passaram nas validações do sistema.')
  }
  if (error.code === '23503') {
    return new Error(
      'Não é possível excluir este curso porque existem turmas vinculadas a ele. Marque-o como inativo em vez de excluir.',
    )
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

/**
 * Busca server-side por nome do curso ou da categoria. Igual ao módulo de
 * Turmas (classes.service.ts): este PostgREST não aceita misturar coluna
 * raiz com coluna de embed no mesmo `.or()` — resolvemos os ids de categoria
 * que combinam com o termo antes, e filtramos `courses` só por colunas raiz.
 */
async function resolveSearchOrClause(term: string): Promise<string> {
  const escaped = term.replace(/[%,()]/g, '')
  const pattern = `%${escaped}%`

  const { data: categoryMatches } = await supabase.from('course_categories').select('id').ilike('name', pattern)

  const clauses = [`name.ilike.${pattern}`]
  const categoryIds = (categoryMatches ?? []).map((c) => c.id)
  if (categoryIds.length > 0) {
    clauses.push(`category_id.in.(${categoryIds.join(',')})`)
  }

  return clauses.join(',')
}

export async function listCourses(filters: CourseFilters): Promise<PaginatedResult<CourseListItem>> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('courses').select(COURSE_SELECT, { count: 'exact' })

  if (filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active')
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.search.trim()) {
    const orClause = await resolveSearchOrClause(filters.search.trim())
    query = query.or(orClause)
  }

  query =
    filters.sortBy === 'recent'
      ? query.order('created_at', { ascending: false })
      : query.order('name', { ascending: true })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de cursos.')
  }

  const total = count ?? 0
  // supabase-js não tem tipos gerados (Database) para este projeto, então não
  // sabe estaticamente que category é uma relação many-to-one (objeto), não
  // many-to-many (array) — o PostgREST já retorna objeto em runtime.
  const items = (data ?? []) as unknown as CourseListItem[]

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

/**
 * Indicadores do topo da listagem (pedido do usuário, referência visual) —
 * 4 contagens simples, cada uma via `head:true` (sem trazer linhas) exceto
 * "matrículas vinculadas", que precisa do embed em `classes` pra filtrar por
 * status da turma. Nenhuma delas soma/deriva de outra — 4 queries leves e
 * independentes, não uma por card de UI renderizado depois.
 */
export async function getCoursesOverview(): Promise<CoursesOverview> {
  const [totalRes, activeRes, categoriesRes, enrollmentsRes] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('course_categories').select('id', { count: 'exact', head: true }),
    supabase
      .from('enrollments')
      .select('id, class:classes!inner(status)', { count: 'exact', head: true })
      .eq('class.status', 'in_progress'),
  ])

  if (totalRes.error) throw mapError(totalRes.error, 'Não foi possível carregar os indicadores de cursos.')
  if (activeRes.error) throw mapError(activeRes.error, 'Não foi possível carregar os indicadores de cursos.')
  if (categoriesRes.error) throw mapError(categoriesRes.error, 'Não foi possível carregar os indicadores de cursos.')
  if (enrollmentsRes.error) throw mapError(enrollmentsRes.error, 'Não foi possível carregar os indicadores de cursos.')

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    categories: categoriesRes.count ?? 0,
    activeClassEnrollments: enrollmentsRes.count ?? 0,
  }
}

export async function getCourse(id: string): Promise<CourseDetail | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(`${COURSE_SELECT}, created_at, updated_at`)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados do curso.')
  }

  return data as unknown as CourseDetail | null
}

export async function createCourse(input: CreateCourseInput): Promise<{ id: string }> {
  const { data, error } = await supabase.from('courses').insert(input).select('id').single()

  if (error) {
    throw mapError(error, 'Não foi possível criar o curso. Tente novamente.')
  }

  return { id: data.id }
}

export async function updateCourse(id: string, input: UpdateCourseInput): Promise<void> {
  const { error } = await supabase.from('courses').update(input).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações do curso.')
  }
}

/**
 * classes.course_id -> courses.id não tem ON DELETE CASCADE (Fase 02): se
 * existirem turmas para o curso, o Postgres rejeita o DELETE com 23503
 * (foreign_key_violation), que mapError traduz para uma mensagem amigável.
 * Nenhuma exclusão em cascata é feita manualmente aqui.
 */
export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir o curso.')
  }
}

/** Turmas vinculadas ao curso, para a seção "Turmas associadas" do detalhe. */
export async function listClassesForCourse(courseId: string): Promise<CourseClassSummary[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, status')
    .eq('course_id', courseId)
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas deste curso.')
  }

  return data ?? []
}
