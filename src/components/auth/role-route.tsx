import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'
import { AuthLoading } from './auth-loading'

interface RoleRouteProps {
  allowedRoles: UserRole[]
  children: ReactNode
  /** Para onde mandar um usuário autenticado mas sem permissão. */
  redirectTo?: string
}

/**
 * Restringe uma rota a determinados perfis. Autocontido: também cobre
 * loading/autenticação, então pode ser usado standalone ou dentro de
 * ProtectedRoute sem se preocupar com a ordem de aninhamento.
 *
 * Lembrete: isto é UX, não segurança. A autorização real é o RLS do
 * Supabase — ver supabase/migrations/20260811120800_rls_and_policies.sql.
 *
 * `redirectTo` padrão é ROUTES.dashboard (Fase 18) — antes da Fase 14,
 * ROUTES.preview era a área autenticada padrão, e esse default nunca foi
 * atualizado quando POST_LOGIN_REDIRECT passou a ser ROUTES.dashboard.
 */
export function RoleRoute({ allowedRoles, children, redirectTo = ROUTES.dashboard }: RoleRouteProps) {
  const { loading, isAuthenticated, role } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
