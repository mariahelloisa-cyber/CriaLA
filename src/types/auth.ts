/**
 * Espelha public.user_role (supabase/migrations/20260811120000_extensions_and_enums.sql).
 * Não redefinir roles aqui sem atualizar a migration correspondente.
 */
export type UserRole = 'seller' | 'manager'

export const ROLE_LABELS: Record<UserRole, string> = {
  seller: 'Vendedor',
  manager: 'Gerente',
}

/**
 * Subconjunto de public.profiles (20260811120100_profiles.sql) exposto ao
 * frontend. Nomes de campo em snake_case de propósito — espelham as colunas
 * reais da tabela, sem camada de tradução.
 */
export interface Profile {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
}
