import type { ClassOption, ClassStatus, EnrollmentStatus } from './students'

export type { ClassOption, ClassStatus, Course, CourseCategory, Unit, PaginatedResult } from './students'

/** Uma turma na listagem — mesmo formato de ClassOption (id/name/status/datas/curso/unidade) já usado no módulo de Alunos. */
export type ClassListItem = ClassOption

/** Turma completa, com metadados de auditoria (para a página de detalhe). */
export interface ClassDetail extends ClassOption {
  created_at: string
  updated_at: string
}

export interface CreateClassInput {
  name: string
  course_id: string
  unit_id: string
  start_date: string
  end_date: string
  status: ClassStatus
  capacity: number | null
}

export type UpdateClassInput = Partial<CreateClassInput>

/** Abas da listagem. Mapeiam 1:1 para public.class_status. */
export type ClassStatusFilter = 'all' | ClassStatus

export interface ClassFilters {
  search: string
  status: ClassStatusFilter
  courseId: string | null
  unitId: string | null
  categoryId: string | null
  page: number
  pageSize: number
}

/** Resumo de uma matrícula para a seção "Alunos matriculados" do detalhe da turma. */
export interface ClassEnrollmentSummary {
  enrollmentId: string
  status: EnrollmentStatus
  studentId: string
  studentName: string
}
