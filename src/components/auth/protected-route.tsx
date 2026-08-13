import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { AuthLoading } from './auth-loading'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Exige sessão autenticada + profile ativo. Usuários não autenticados são
 * redirecionados para /login, preservando a rota original em location.state
 * para retorno automático após o login (ver LoginPage).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  return <>{children}</>
}
