import { supabase } from '@/lib/supabase'
import { listSellerGoalSummariesForRange, rankSellersByValue } from '@/services/goals.service'
import type { SellerOption } from '@/types/goals'
import type { SellerListItem } from '@/types/sellers'

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

/**
 * Fase 21 — visão agregada de Vendedores para a listagem/gestão do gerente.
 * Uma consulta ampla por tabela (profiles/students/enrollments) + agregação
 * em memória, nunca uma query por vendedor (mesmo padrão já usado em
 * goals.service.ts/reports.service.ts desde as Fases 12/13). O
 * valor/meta/%/ranking reaproveita 100% o cálculo já centralizado da Fase 19
 * (listSellerGoalSummariesForRange + rankSellersByValue) — nenhuma fórmula
 * nova.
 *
 * "Alunos cadastrados" e "Matrículas" são contagens totais (todo o
 * histórico), não filtradas pelo período do ranking — a Fase 21 não define
 * uma regra de "alunos cadastrados no período", só "alunos vinculados ao
 * vendedor através de students.created_by", que é atemporal por natureza.
 */
export async function listSellersOverview(fromIso: string, toIso: string): Promise<SellerListItem[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_active')
    .eq('role', 'seller')
    .order('full_name', { ascending: true })

  if (profilesError) {
    throw mapError(profilesError, 'Não foi possível carregar os vendedores.')
  }

  const rows = profiles ?? []
  const sellers: SellerOption[] = rows.map((p) => ({ id: p.id, full_name: p.full_name }))

  const [studentsRes, enrollmentsRes, summaries] = await Promise.all([
    supabase.from('students').select('id, created_by'),
    supabase.from('enrollments').select('id, student:students!inner(created_by)'),
    listSellerGoalSummariesForRange(fromIso, toIso, sellers),
  ])

  if (studentsRes.error) throw mapError(studentsRes.error, 'Não foi possível carregar os alunos por vendedor.')
  if (enrollmentsRes.error) throw mapError(enrollmentsRes.error, 'Não foi possível carregar as matrículas por vendedor.')

  const studentsCountBySeller = new Map<string, number>()
  for (const s of studentsRes.data ?? []) {
    if (!s.created_by) continue
    studentsCountBySeller.set(s.created_by, (studentsCountBySeller.get(s.created_by) ?? 0) + 1)
  }

  const enrollmentsCountBySeller = new Map<string, number>()
  for (const e of (enrollmentsRes.data ?? []) as unknown as { student: { created_by: string } | null }[]) {
    const sellerId = e.student?.created_by
    if (!sellerId) continue
    enrollmentsCountBySeller.set(sellerId, (enrollmentsCountBySeller.get(sellerId) ?? 0) + 1)
  }

  const ranked = rankSellersByValue(summaries)
  const rankedBySeller = new Map(ranked.map((r) => [r.seller.id, r]))
  const totalSellers = ranked.length

  return rows.map((profile) => {
    const summary = rankedBySeller.get(profile.id)
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      is_active: profile.is_active,
      studentsCount: studentsCountBySeller.get(profile.id) ?? 0,
      enrollmentsCount: enrollmentsCountBySeller.get(profile.id) ?? 0,
      realizedAmount: summary?.realizedAmount ?? 0,
      realizedStudents: summary?.realizedStudents ?? 0,
      goal: summary?.goal ?? null,
      financialPercent: summary?.financialPercent ?? 0,
      rank: summary?.rank ?? null,
      totalSellers,
    }
  })
}

/**
 * Ativar/desativar vendedor — só troca profiles.is_active (RLS
 * profiles_update_manager já restringe isto ao gerente). Nunca apaga nem
 * altera aluno/matrícula/venda/meta vinculados; students.created_by e
 * sales.seller_id continuam apontando para este id normalmente (histórico
 * preservado). AuthContext já trata is_active=false forçando signOut no
 * próximo carregamento de sessão (ver Fase 04) — nenhuma lógica nova aqui.
 */
export async function updateSellerStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível atualizar o status do vendedor.')
  }
}

/**
 * Único campo de edição seguro nesta fase: full_name. E-mail/senha exigem
 * Supabase Auth Admin API (service_role/Edge Function) — infraestrutura que
 * não existe neste projeto (ver relatório final da Fase 21, seção P/Q) — a
 * UI não oferece editá-los.
 */
export async function updateSellerName(id: string, fullName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível atualizar o vendedor.')
  }
}

export async function getSeller(id: string): Promise<SellerOption & { email: string | null; is_active: boolean } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_active')
    .eq('id', id)
    .eq('role', 'seller')
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados do vendedor.')
  }

  return data
}
