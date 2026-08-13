import type { UserMenuUser } from '@/components/navigation/user-menu'
import { ROLE_LABELS } from '@/types/auth'
import { useAuth } from './useAuth'

/** Mapeia o profile autenticado para o formato que AppShell/Header esperam. */
export function useShellUser(): UserMenuUser | null {
  const { profile } = useAuth()

  if (!profile) return null

  return {
    name: profile.full_name,
    role: ROLE_LABELS[profile.role],
    email: profile.email ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
  }
}
