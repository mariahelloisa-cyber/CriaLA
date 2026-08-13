import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listSellers } from '@/services/students.service'
import type { SellerOption } from '@/types/goals'

/**
 * Extraído de goals-page.tsx na Fase 13, quando o módulo de Relatórios
 * precisou exatamente da mesma lógica de "quais vendedores este usuário pode
 * ver" (gerente: todos, carregados uma vez; vendedor: só o próprio perfil,
 * sem query). Mesmo critério de promoção já usado para StudentPicker/
 * EnrollmentPicker/CurrencyInput: só extrair quando um segundo lugar precisa
 * de verdade.
 *
 * `useMemo` em `ownSeller`/`scopedSellers` não é só otimização: um array
 * novo a cada render aqui mudaria a identidade de dependências de hooks que
 * consomem `scopedSellers` (ex.: useGoalsDashboard), causando um loop
 * infinito de requisições — bug real já encontrado e corrigido na Fase 12
 * (ver memória do projeto). Preservado aqui deliberadamente.
 */
export function useScopedSellers() {
  const { isManager, profile } = useAuth()
  const [sellers, setSellers] = useState<SellerOption[]>([])
  const [sellersLoaded, setSellersLoaded] = useState(!isManager)
  // Fase 21: "Ver desempenho"/"Ver metas" da página de Vendedores navegam
  // para cá com ?vendedor=<id> — lido só uma vez, na montagem (lazy
  // initializer), como valor inicial do filtro já existente. Não cria filtro
  // novo, só permite pré-selecionar o que o Select de vendedor já fazia.
  const [searchParams] = useSearchParams()
  const [sellerFilter, setSellerFilter] = useState<string | null>(() => searchParams.get('vendedor'))

  useEffect(() => {
    if (!isManager) return
    let active = true
    listSellers()
      .then((data) => {
        if (active) {
          setSellers(data)
          setSellersLoaded(true)
        }
      })
      .catch(() => {
        if (active) setSellersLoaded(true)
      })
    return () => {
      active = false
    }
  }, [isManager])

  const ownSeller: SellerOption | null = useMemo(
    () => (profile ? { id: profile.id, full_name: profile.full_name } : null),
    [profile],
  )
  const scopedSellers = useMemo(
    () => (isManager ? sellers : ownSeller ? [ownSeller] : []),
    [isManager, sellers, ownSeller],
  )
  const effectiveSellerId = isManager ? (sellerFilter ?? undefined) : ownSeller?.id
  const enabled = isManager ? sellersLoaded : Boolean(ownSeller)
  /** Visão de um único vendedor: o próprio vendedor logado, ou o gerente filtrando por um vendedor específico. */
  const isSingleView = !isManager || sellerFilter !== null

  return {
    isManager,
    sellers,
    sellersLoaded,
    sellerFilter,
    setSellerFilter,
    ownSeller,
    scopedSellers,
    effectiveSellerId,
    enabled,
    isSingleView,
  }
}
