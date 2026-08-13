import { supabase } from '@/lib/supabase'
import { todayIso } from '@/utils/format-date'
import type { ClassStatus, EnrollmentStatus } from '@/types/students'

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

export interface AcademicReportFilters {
  courseId: string | null
  classId: string | null
  unitId: string | null
  categoryId: string | null
}

/**
 * Uma matrícula "achatada", só com os campos usados pelos 7 relatórios
 * acadêmicos da Fase 17 (Por Turma, Por Curso, Por Categoria, Por Período,
 * Em Formação, Próximas Formaturas, Formados) — buscada UMA VEZ por conjunto
 * de filtros e reaproveitada por todas as agregações abaixo, nunca uma query
 * por turma/curso/categoria/relatório.
 */
export interface AcademicEnrollmentRow {
  id: string
  studentId: string
  studentName: string
  enrollmentDate: string
  expectedGraduationDate: string | null
  status: EnrollmentStatus
  classId: string
  className: string
  classStatus: ClassStatus
  courseId: string | null
  courseName: string | null
  categoryId: string | null
  categoryName: string | null
  unitId: string | null
  unitName: string | null
}

interface RawEnrollmentRow {
  id: string
  student_id: string
  enrollment_date: string
  expected_graduation_date: string | null
  status: EnrollmentStatus
  student: { id: string; full_name: string }
  class: {
    id: string
    name: string
    status: ClassStatus
    unit: { id: string; name: string } | null
    course: { id: string; name: string; category: { id: string; name: string } | null } | null
  }
}

/** category_id não é coluna direta de `enrollments`/`classes` — resolve via courses primeiro (mesma técnica de ids auxiliares das Fases 08–13). */
async function resolveCourseIdsForCategory(categoryId: string): Promise<string[]> {
  const { data } = await supabase.from('courses').select('id').eq('category_id', categoryId)
  return (data ?? []).map((c) => c.id)
}

/**
 * Query única para toda a seção de Relatórios Acadêmicos. `classId`/
 * `courseId`/`unitId` são filtros de embed de 1 nível (`.eq('class.x', ...)`),
 * mesma técnica já comprovada em students.service.ts. `categoryId` precisa
 * do passo de resolução auxiliar acima, porque filtrar 2 níveis de embed
 * (`class.course.category_id`) nunca foi testado neste projeto — preferi a
 * técnica já comprovada a arriscar um filtro PostgREST não verificado.
 */
export async function fetchEnrollmentsForAcademicReport(filters: AcademicReportFilters): Promise<AcademicEnrollmentRow[]> {
  let query = supabase.from('enrollments').select(
    `id, student_id, enrollment_date, expected_graduation_date, status,
     student:students!inner(id, full_name),
     class:classes!inner(id, name, status,
       unit:units(id, name),
       course:courses(id, name, category:course_categories(id, name))
     )`,
  )

  if (filters.classId) query = query.eq('class_id', filters.classId)
  if (filters.courseId) query = query.eq('class.course_id', filters.courseId)
  if (filters.unitId) query = query.eq('class.unit_id', filters.unitId)
  if (filters.categoryId) {
    const courseIds = await resolveCourseIdsForCategory(filters.categoryId)
    query = query.in('class.course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, error } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados acadêmicos.')
  }

  const rows = (data ?? []) as unknown as RawEnrollmentRow[]

  return rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.student.full_name,
    enrollmentDate: row.enrollment_date,
    expectedGraduationDate: row.expected_graduation_date,
    status: row.status,
    classId: row.class.id,
    className: row.class.name,
    classStatus: row.class.status,
    courseId: row.class.course?.id ?? null,
    courseName: row.class.course?.name ?? null,
    categoryId: row.class.course?.category?.id ?? null,
    categoryName: row.class.course?.category?.name ?? null,
    unitId: row.class.unit?.id ?? null,
    unitName: row.class.unit?.name ?? null,
  }))
}

export interface ClassReportItem {
  classId: string
  className: string
  classStatus: ClassStatus
  courseName: string | null
  unitName: string | null
  studentCount: number
}

export interface CourseReportItem {
  courseId: string
  courseName: string
  categoryName: string | null
  studentCount: number
}

export interface CategoryReportItem {
  categoryId: string | null
  categoryName: string | null
  studentCount: number
}

export interface PeriodReportItem {
  date: string
  studentCount: number
}

export interface UnitReportItem {
  unitId: string | null
  unitName: string | null
  studentCount: number
}

/**
 * Estratégia de contagem (seção 3 do prompt): todos os relatórios
 * agrupados (Turma/Curso/Categoria/Período) usam alunos DISTINTOS dentro de
 * cada grupo — um aluno com 2 matrículas na mesma turma (schema permite,
 * decisão da Fase 10) não pode contar como 2 "alunos" naquela turma. Entre
 * grupos diferentes, o mesmo aluno legitimamente conta em cada um (está
 * matriculado de fato em cada turma/curso/categoria). Só turmas/cursos/
 * categorias com pelo menos 1 aluno correspondente aparecem — mesmo
 * critério já usado em dashboard.service.ts:listStudentCountByCategory
 * (Fase 14), para manter consistência em vez de reconciliar contra o
 * roster completo de turmas/cursos/categorias.
 */
export function aggregateByClass(rows: AcademicEnrollmentRow[]): ClassReportItem[] {
  const byClass = new Map<
    string,
    { className: string; classStatus: ClassStatus; courseName: string | null; unitName: string | null; students: Set<string> }
  >()

  for (const row of rows) {
    const acc = byClass.get(row.classId) ?? {
      className: row.className,
      classStatus: row.classStatus,
      courseName: row.courseName,
      unitName: row.unitName,
      students: new Set<string>(),
    }
    acc.students.add(row.studentId)
    byClass.set(row.classId, acc)
  }

  return [...byClass.entries()]
    .map(([classId, acc]) => ({
      classId,
      className: acc.className,
      classStatus: acc.classStatus,
      courseName: acc.courseName,
      unitName: acc.unitName,
      studentCount: acc.students.size,
    }))
    .sort((a, b) => b.studentCount - a.studentCount)
}

export function aggregateByCourse(rows: AcademicEnrollmentRow[]): CourseReportItem[] {
  const byCourse = new Map<string, { courseName: string; categoryName: string | null; students: Set<string> }>()

  for (const row of rows) {
    if (!row.courseId) continue
    const acc = byCourse.get(row.courseId) ?? {
      courseName: row.courseName ?? '—',
      categoryName: row.categoryName,
      students: new Set<string>(),
    }
    acc.students.add(row.studentId)
    byCourse.set(row.courseId, acc)
  }

  return [...byCourse.entries()]
    .map(([courseId, acc]) => ({ courseId, courseName: acc.courseName, categoryName: acc.categoryName, studentCount: acc.students.size }))
    .sort((a, b) => b.studentCount - a.studentCount)
}

export function aggregateByCategory(rows: AcademicEnrollmentRow[]): CategoryReportItem[] {
  const byCategory = new Map<string, { categoryName: string | null; students: Set<string> }>()

  for (const row of rows) {
    const key = row.categoryId ?? 'sem-categoria'
    const acc = byCategory.get(key) ?? { categoryName: row.categoryName, students: new Set<string>() }
    acc.students.add(row.studentId)
    byCategory.set(key, acc)
  }

  return [...byCategory.entries()]
    .map(([key, acc]) => ({
      categoryId: key === 'sem-categoria' ? null : key,
      categoryName: acc.categoryName,
      studentCount: acc.students.size,
    }))
    .sort((a, b) => b.studentCount - a.studentCount)
}

/**
 * "Alunos por Unidade" (Fase 18 — PDF seção 8, coberto pela query já
 * existente da Fase 17, `unit` já vinha embutida em `classes`). Mesmo
 * critério de contagem de aggregateByCategory: alunos DISTINTOS por
 * unidade — um aluno com 2 matrículas na mesma unidade não pode contar
 * como 2 "alunos" nela. Nenhuma query nova.
 */
export function aggregateByUnit(rows: AcademicEnrollmentRow[]): UnitReportItem[] {
  const byUnit = new Map<string, { unitName: string | null; students: Set<string> }>()

  for (const row of rows) {
    const key = row.unitId ?? 'sem-unidade'
    const acc = byUnit.get(key) ?? { unitName: row.unitName, students: new Set<string>() }
    acc.students.add(row.studentId)
    byUnit.set(key, acc)
  }

  return [...byUnit.entries()]
    .map(([key, acc]) => ({
      unitId: key === 'sem-unidade' ? null : key,
      unitName: acc.unitName,
      studentCount: acc.students.size,
    }))
    .sort((a, b) => b.studentCount - a.studentCount)
}

/**
 * "Alunos por Período" — o PDF não define qual data representa o período
 * acadêmico. Escolhida `enrollment_date` (data da matrícula): é o
 * equivalente acadêmico direto de `sales.sale_date` (Fase 13) — a data em
 * que o vínculo aluno-turma nasceu, o "evento" acadêmico análogo à venda
 * comercial. `created_at` foi descartado por ser metadado técnico de
 * auditoria, não um dado de negócio (mesmo raciocínio já usado em toda
 * consulta de período do projeto desde a Fase 08). `expected_graduation_date`
 * representa formatura futura, não entrada — usada nos relatórios de
 * formatura, não aqui. Decisão documentada no relatório final da Fase 17.
 */
export function aggregateByPeriod(rows: AcademicEnrollmentRow[], dateFrom: string, dateTo: string): PeriodReportItem[] {
  const byDay = new Map<string, Set<string>>()

  for (const row of rows) {
    if (row.enrollmentDate < dateFrom || row.enrollmentDate > dateTo) continue
    const students = byDay.get(row.enrollmentDate) ?? new Set<string>()
    students.add(row.studentId)
    byDay.set(row.enrollmentDate, students)
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, students]) => ({ date, studentCount: students.size }))
}

/**
 * Em Formação / Próximas Formaturas / Formados: relatórios de LISTAGEM, não
 * de contagem agregada — cada linha é uma matrícula real, sem deduplicação
 * (um aluno com 2 matrículas ativas simultâneas legitimamente aparece 2
 * vezes, uma por matrícula). Mesmo critério já usado no Dashboard
 * (countActiveEnrollments/listUpcomingGraduations contam linhas de
 * enrollments, não alunos distintos) — reaproveitado aqui por instrução
 * explícita de não criar uma regra diferente da já usada no Dashboard.
 */
export function filterActiveEnrollments(rows: AcademicEnrollmentRow[]): AcademicEnrollmentRow[] {
  return rows.filter((row) => row.status === 'active')
}

const GRADUATION_WINDOW_DAYS = 90

/** Mesma janela de 90 dias do Dashboard (Fase 14) — o PDF não define uma janela; mantida para consistência, conforme instruído. */
export function filterUpcomingGraduations(rows: AcademicEnrollmentRow[]): AcademicEnrollmentRow[] {
  const today = todayIso()
  const windowEnd = new Date(Date.now() + GRADUATION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return rows
    .filter(
      (row) =>
        row.status === 'active' &&
        row.expectedGraduationDate !== null &&
        row.expectedGraduationDate >= today &&
        row.expectedGraduationDate <= windowEnd,
    )
    .sort((a, b) => (a.expectedGraduationDate ?? '').localeCompare(b.expectedGraduationDate ?? ''))
}

/**
 * "Alunos Formados": public.enrollment_status já tem um valor explícito
 * para isso — 'completed', rotulado "Formado" em toda a aplicação desde a
 * Fase 07 (ver pages/students/components/status-badges.tsx). Não foi
 * necessário inventar nenhuma regra baseada em data.
 */
export function filterGraduatedEnrollments(rows: AcademicEnrollmentRow[]): AcademicEnrollmentRow[] {
  return rows.filter((row) => row.status === 'completed')
}
