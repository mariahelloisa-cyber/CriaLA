import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import * as authService from '@/services/auth.service'
import type { Profile } from '@/types/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Busca o profile do usuário e valida se ele pode de fato usar o sistema
   * (existe + está ativo). Em qualquer falha dessas checagens, encerra a
   * sessão — a UI nunca decide sozinha se o acesso é válido, apenas reflete
   * o que o backend permitiu buscar; a autoridade de segurança real continua
   * sendo o RLS do Supabase.
   */
  const loadProfileForUser = useCallback(async (authUser: User) => {
    try {
      const fetchedProfile = await authService.fetchProfile(authUser.id)

      if (!fetchedProfile) {
        setError('Não encontramos seu perfil de acesso. Contate o administrador do sistema.')
        setProfile(null)
        await supabase.auth.signOut()
        return
      }

      if (!fetchedProfile.is_active) {
        setError('Seu acesso está desativado. Contate o administrador do sistema.')
        setProfile(null)
        await supabase.auth.signOut()
        return
      }

      setProfile(fetchedProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seus dados.')
      setProfile(null)
      await supabase.auth.signOut()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      if (session?.user) {
        setUser(session.user)
        await loadProfileForUser(session.user)
      }

      if (active) setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // A sessão inicial já é tratada por init() acima — ignorar para não
      // buscar o profile duas vezes na carga da página.
      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN') {
        if (session?.user) {
          setLoading(true)
          setUser(session.user)
          void loadProfileForUser(session.user).finally(() => {
            if (active) setLoading(false)
          })
        }
        return
      }

      // TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED...
      if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfileForUser])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    await authService.signInWithPassword(email, password)
    // user/profile são preenchidos pelo listener SIGNED_IN acima — não
    // duplicar a busca de profile aqui.
  }, [])

  const handleSignOut = useCallback(async () => {
    await authService.signOut()
    // user/profile são limpos pelo listener SIGNED_OUT acima.
  }, [])

  const role = profile?.role ?? null

  const value: AuthContextValue = {
    user,
    profile,
    role,
    loading,
    isAuthenticated: Boolean(user && profile),
    isManager: role === 'manager',
    isSeller: role === 'seller',
    error,
    signIn,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
