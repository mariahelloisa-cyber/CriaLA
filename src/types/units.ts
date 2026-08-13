import type { ClassStatus, Unit } from './classes'

export type { Unit } from './classes'

/** public.units. Estende o Unit "enxuto" (id/name) já usado nos dropdowns de Alunos/Turmas com os campos que só o módulo de Unidades precisa. */
export interface UnitListItem extends Unit {
  is_active: boolean
}

export interface UnitDetail extends UnitListItem {
  created_at: string
  updated_at: string
}

export interface CreateUnitInput {
  name: string
  is_active: boolean
}

export type UpdateUnitInput = Partial<CreateUnitInput>

export type UnitStatusFilter = 'all' | 'active' | 'inactive'

export interface UnitFilters {
  search: string
  status: UnitStatusFilter
  page: number
  pageSize: number
}

/** Resumo de turma para a seção "Turmas da unidade" do detalhe da unidade. */
export interface UnitClassSummary {
  id: string
  name: string
  status: ClassStatus
}
