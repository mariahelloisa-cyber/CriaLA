import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/auth'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  isAuthenticated: boolean
  isManager: boolean
  isSeller: boolean
  /** Motivo de uma sessão encerrada automaticamente (perfil inativo,
   * ausente ou inválido) — não é o erro de um submit de login com falha. */
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
