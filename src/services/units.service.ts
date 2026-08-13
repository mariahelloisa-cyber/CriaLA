import { supabase } from '@/lib/supabase'
import type { PaginatedResult } from '@/types/classes'
import type {
  CreateUnitInput,
  UnitClassSummary,
  UnitDetail,
  UnitFilters,
  UnitListItem,
  UpdateUnitInput,
} from '@/types/units'

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23514') {
    return new Error('Alguns dados não passaram nas validações do sistema.')
  }
  if (error.code === '23503') {
    return new Error(
      'Não é possível excluir esta unidade porque existem turmas vinculadas a ela. Marque-a como inativa em vez de excluir.',
    )
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

export async function listUnits(filters: UnitFilters): Promise<PaginatedResult<UnitListItem>> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('units').select('id, name, is_active', { count: 'exact' })

  if (filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active')
  }
  if (filters.search.trim()) {
    const escaped = filters.search.trim().replace(/[%,()]/g, '')
    query = query.ilike('name', `%${escaped}%`)
  }

  query = query.order('name', { ascending: true }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de unidades.')
  }

  const total = count ?? 0

  return {
    items: data ?? [],
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function getUnit(id: string): Promise<UnitDetail | null> {
  const { data, error } = await supabase
    .from('units')
    .select('id, name, is_active, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados da unidade.')
  }

  return data
}

export async function createUnit(input: CreateUnitInput): Promise<{ id: string }> {
  const { data, error } = await supabase.from('units').insert(input).select('id').single()

  if (error) {
    throw mapError(error, 'Não foi possível criar a unidade. Tente novamente.')
  }

  return { id: data.id }
}

export async function updateUnit(id: string, input: UpdateUnitInput): Promise<void> {
  const { error } = await supabase.from('units').update(input).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações da unidade.')
  }
}

/**
 * classes.unit_id -> units.id não tem ON DELETE CASCADE (Fase 02): se
 * existirem turmas para a unidade, o Postgres rejeita o DELETE com 23503
 * (foreign_key_violation), que mapError traduz para uma mensagem amigável.
 */
export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase.from('units').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir a unidade.')
  }
}

/** Turmas vinculadas à unidade, para a seção "Turmas da unidade" do detalhe. */
export async function listClassesForUnit(unitId: string): Promise<UnitClassSummary[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, status')
    .eq('unit_id', unitId)
    .order('name', { ascending: true })

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas desta unidade.')
  }

  return data ?? []
}
