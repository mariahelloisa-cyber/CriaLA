import type { ClassOption } from './classes'

export type { ClassOption } from './classes'

/** public.teachers, para a listagem — inclui a contagem de turmas administradas. */
export interface TeacherListItem {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  subject_area: string
  is_active: boolean
  contract_file_name: string | null
  contract_file_path: string | null
  classCount: number
}

/** Professor completo, com metadados de auditoria (para a página de detalhe). */
export interface TeacherDetail {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  subject_area: string
  is_active: boolean
  contract_file_path: string | null
  contract_file_name: string | null
  created_at: string
  updated_at: string
}

export interface CreateTeacherInput {
  full_name: string
  email?: string | null
  phone?: string | null
  subject_area: string
  is_active: boolean
}

export type UpdateTeacherInput = Partial<CreateTeacherInput>

export type TeacherStatusFilter = 'all' | 'active' | 'inactive'

export interface TeacherFilters {
  search: string
  status: TeacherStatusFilter
  page: number
  pageSize: number
}

/** Turma administrada por um professor, para a seção "Turmas administradas" do detalhe. */
export type TeacherClassSummary = ClassOption
