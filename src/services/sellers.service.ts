import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { listSellerGoalSummariesForRange, rankSellersByValue } from '@/services/goals.service'
import type { SellerOption } from '@/types/goals'
import type { CreateSellerInput, ResetSellerPasswordInput, SellerListItem, UpdateSellerInput } from '@/types/sellers'

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
 *
 * Fase 22 — "gerente não pode se autodesativar": não existia essa regra em
 * nenhuma fase anterior, e não foi criada uma nova aqui. Não é necessária:
 * listSellersOverview()/getSeller() só trazem role='seller', então o
 * próprio gerente nunca aparece como linha em /vendedores — não há como
 * clicar em "Desativar" na própria conta por essa tela, por construção.
 */
export async function updateSellerStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível atualizar o status do vendedor.')
  }
}

/**
 * Chamada padrão para as Edge Functions de administração de vendedor
 * (create-seller/update-seller/reset-seller-password) — todas seguem o
 * mesmo contrato de erro (`{ error: string }` no corpo de uma
 * FunctionsHttpError), então a extração de mensagem amigável fica num só
 * lugar em vez de repetida em cada função exportada.
 */
async function invokeSellerFunction<T>(name: string, body: object, fallback: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> })

  if (error) {
    let message = fallback
    if (error instanceof FunctionsHttpError) {
      try {
        const errorBody = await error.context.json()
        if (typeof errorBody?.error === 'string') message = errorBody.error
      } catch {
        // Mantém a mensagem genérica se o corpo do erro não vier como JSON.
      }
    }
    throw new Error(message)
  }

  return data as T
}

/**
 * Fase 22 — cria um vendedor de verdade (usuário do Supabase Auth + profile
 * via o trigger já existente, handle_new_auth_user). Chama a Edge Function
 * `create-seller`, único lugar do sistema que usa a service_role — nunca no
 * client. A function valida no servidor que quem chama é gerente ativo
 * (mesma condição de public.is_manager()); o frontend não decide isso, só
 * reflete o que a function autorizou.
 */
export async function createSeller(input: CreateSellerInput): Promise<{ id: string }> {
  return invokeSellerFunction('create-seller', input, 'Não foi possível criar o vendedor. Tente novamente.')
}

/**
 * Fase 23 — edita nome e e-mail de um vendedor via Edge Function
 * `update-seller`. E-mail é campo de auth.users (Supabase Auth), não de
 * profiles — só pode ser alterado com segurança pela Admin API no servidor
 * (mesmo motivo/mesma restrição de service_role de createSeller). A function
 * também atualiza profiles.full_name/email para manter os dois em
 * sincronia. Desde a Fase 23, nome e e-mail são salvos juntos numa única
 * chamada pelo diálogo "Editar vendedor" — não existe mais um update direto
 * de full_name isolado no client.
 */
export async function updateSeller(input: UpdateSellerInput): Promise<void> {
  await invokeSellerFunction('update-seller', input, 'Não foi possível atualizar o vendedor. Tente novamente.')
}

/**
 * Fase 23 — define uma nova senha para um vendedor via Edge Function
 * `reset-seller-password`. Senha nunca é lida/gravada por este client — só
 * repassada para a function, que chama a Admin API do Supabase Auth.
 */
export async function resetSellerPassword(input: ResetSellerPasswordInput): Promise<void> {
  await invokeSellerFunction('reset-seller-password', input, 'Não foi possível alterar a senha. Tente novamente.')
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
