import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/auth'

const VALID_ROLES: UserRole[] = ['seller', 'manager']

function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole)
}

/** Traduz erros do Supabase Auth para mensagens seguras e amigáveis. Nunca
 * repassar error.message bruto para a UI (pode conter detalhes internos). */
function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Credenciais inválidas. Verifique seu e-mail e senha.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.'
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.'
  }
  return 'Não foi possível entrar. Tente novamente em instantes.'
}

/** Lança um Error com mensagem já segura para exibir ao usuário. */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(mapAuthError(error.message))
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error('Não foi possível encerrar a sessão. Tente novamente.')
  }
}

/**
 * Busca o profile do usuário autenticado. Retorna null se o registro não
 * existir (não deve acontecer em uso normal, já que o trigger do banco cria
 * o profile automaticamente — ver 20260811120700_auth_profile_trigger.sql).
 * Lança erro em falha de rede/RLS ou role inválido/ausente.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error('Não foi possível carregar os dados do seu perfil.')
  }

  if (!data) {
    return null
  }

  if (!isValidRole(data.role)) {
    throw new Error('Seu perfil está com uma configuração inválida. Contate o administrador.')
  }

  return data as Profile
}
