import { supabase } from '@/lib/supabase'
import { todayIso } from '@/utils/format-date'
import { currentPeriod, firstDayOfPeriodIso, lastDayOfPeriodIso, periodsBack } from '@/utils/period'
import type { CategoryStudentCount, EnrollmentsByMonth, UpcomingGraduation } from '@/types/dashboard'

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
 * Os 4 indicadores acadêmicos do Dashboard do Gerente (PDF seção 7) que não
 * existiam em nenhum service anterior. Meta financeira, realizado, %,
 * ranking, Metas da Empresa e Metas por Vendedor são 100% reaproveitados de
 * goals.service.ts — nada disso é recalculado aqui.
 *
 * São "estado atual" (não filtrados por período): Total de Matrículas está
 * agrupado no PDF junto de indicadores claramente atemporais (Alunos em
 * Formação, Próximas Formaturas), então a leitura mais fiel é "quantas
 * matrículas existem hoje no sistema", não "quantas neste mês" — decisão
 * documentada no relatório final da Fase 14.
 */

/** Contagem pura via `head:true` — não busca nenhuma linha, só o total (PostgREST count exato). */
export async function countEnrollments(): Promise<number> {
  const { count, error } = await supabase.from('enrollments').select('id', { count: 'exact', head: true })
  if (error) throw mapError(error, 'Não foi possível carregar o total de matrículas.')
  return count ?? 0
}

/** "Alunos em Formação" = matrículas com status ativo (enrollment_status = 'active', mesmo enum da Fase 02/07). */
export async function countActiveEnrollments(): Promise<number> {
  const { count, error } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw mapError(error, 'Não foi possível carregar os alunos em formação.')
  return count ?? 0
}

const GRADUATION_WINDOW_DAYS = 90

/**
 * "Próximas Formaturas": matrículas ativas com expected_graduation_date nos
 * próximos 90 dias — o PDF não define a janela; 90 dias é uma escolha de
 * implementação conservadora e documentada (mesmo padrão de decisões não
 * especificadas nas Fases 11/12/13).
 */
export async function listUpcomingGraduations(limit = 8): Promise<UpcomingGraduation[]> {
  const today = todayIso()
  const windowEnd = new Date(Date.now() + GRADUATION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('enrollments')
    .select(
      `id, expected_graduation_date,
       student:students!inner(id, full_name),
       class:classes(course:courses(name))`,
    )
    .eq('status', 'active')
    .gte('expected_graduation_date', today)
    .lte('expected_graduation_date', windowEnd)
    .order('expected_graduation_date', { ascending: true })
    .limit(limit)

  if (error) throw mapError(error, 'Não foi possível carregar as próximas formaturas.')

  return ((data ?? []) as unknown as Array<{
    id: string
    expected_graduation_date: string
    student: { id: string; full_name: string }
    class: { course: { name: string } | null } | null
  }>).map((row) => ({
    enrollmentId: row.id,
    studentId: row.student.id,
    studentName: row.student.full_name,
    expectedGraduationDate: row.expected_graduation_date,
    courseName: row.class?.course?.name ?? null,
  }))
}

/**
 * "Quantidade de Alunos por Categoria": uma única query (todas as
 * matrículas com a categoria do curso embutida), contagem de alunos
 * DISTINTOS por categoria em memória — nunca uma query por categoria. Um
 * mesmo aluno com matrículas em categorias diferentes conta em cada uma
 * (matriculado de fato em ambas); dentro da mesma categoria, não é contado
 * duas vezes.
 */
export async function listStudentCountByCategory(): Promise<CategoryStudentCount[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('student_id, class:classes(course:courses(category:course_categories(id, name)))')

  if (error) throw mapError(error, 'Não foi possível carregar a distribuição de alunos por categoria.')

  const rows = (data ?? []) as unknown as Array<{
    student_id: string
    class: { course: { category: { id: string; name: string } | null } | null } | null
  }>

  const byCategory = new Map<string, { category: CategoryStudentCount['category']; students: Set<string> }>()

  for (const row of rows) {
    const category = row.class?.course?.category ?? null
    const key = category?.id ?? 'sem-categoria'
    const acc = byCategory.get(key) ?? { category, students: new Set<string>() }
    acc.students.add(row.student_id)
    byCategory.set(key, acc)
  }

  return [...byCategory.values()]
    .map(({ category, students }) => ({ category, studentCount: students.size }))
    .sort((a, b) => b.studentCount - a.studentCount)
}

/**
 * "Matrículas por mês": quantidade de REGISTROS de `enrollments` (não alunos
 * distintos) por mês de `enrollment_date` — o evento acadêmico de matrícula
 * (Fase 17/18), nunca `created_at`, e nada de `sales`/`sale_date`. Uma única
 * query trazendo só `enrollment_date` dentro do intervalo dos últimos
 * `monthsBack` meses (padrão 6, incluindo o mês atual), agregada em memória
 * — nunca uma query por mês. O RLS de `enrollments_select` escopa sozinho
 * quem vê o quê (gerente: tudo; vendedor: só matrículas de alunos que
 * cadastrou), então nenhum filtro de `sellerId` é aplicado aqui. Meses sem
 * matrícula entram com `count: 0` (nunca omitidos do resultado).
 */
export async function listEnrollmentsByMonth(monthsBack = 6): Promise<EnrollmentsByMonth[]> {
  const periods = periodsBack(currentPeriod(), monthsBack)
  const rangeStart = firstDayOfPeriodIso(periods[0] ?? currentPeriod())
  const rangeEnd = lastDayOfPeriodIso(periods[periods.length - 1] ?? currentPeriod())

  const { data, error } = await supabase
    .from('enrollments')
    .select('enrollment_date')
    .gte('enrollment_date', rangeStart)
    .lte('enrollment_date', rangeEnd)

  if (error) throw mapError(error, 'Não foi possível carregar as matrículas por mês.')

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as Array<{ enrollment_date: string }>) {
    const key = row.enrollment_date.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return periods.map((period) => {
    const key = `${period.year}-${String(period.month).padStart(2, '0')}`
    return { month: period.month, year: period.year, count: counts.get(key) ?? 0 }
  })
}
