import type { ClassOption } from './classes'
import type { EnrollmentStatus } from './students'

export type { ClassOption, ClassStatus, Course, CourseCategory, PaginatedResult, Unit } from './classes'
export type { EnrollmentStatus } from './students'

/** Aluno "enxuto" para exibição na listagem/detalhe de matrículas — students não tem FK para classes, então isso sempre vem embutido a partir de enrollments. */
export interface EnrollmentStudent {
  id: string
  full_name: string
  cpf: string | null
  email: string | null
  phone: string | null
  created_by: string
  /** Vendedor dono do aluno (students.created_by → profiles), exibido na coluna "Vendedor". */
  seller: { id: string; full_name: string } | null
}

/** Uma matrícula na listagem, com aluno e turma (curso/categoria/unidade) embutidos. */
export interface EnrollmentListItem {
  id: string
  enrollmentDate: string
  expectedGraduationDate: string | null
  status: EnrollmentStatus
  student: EnrollmentStudent
  class: ClassOption | null
}

export interface EnrollmentDetail extends EnrollmentListItem {
  created_at: string
  updated_at: string
}

export interface CreateEnrollmentInput {
  student_id: string
  class_id: string
  enrollment_date: string
  expected_graduation_date?: string | null
  status: EnrollmentStatus
  /** RLS (enrollments_insert) exige created_by = auth.uid() — sem default no banco, precisa vir do client. */
  created_by: string
}

export type EnrollmentStatusFilter = 'all' | EnrollmentStatus
export type EnrollmentSortBy = 'recent' | 'name'

export interface EnrollmentFilters {
  search: string
  status: EnrollmentStatusFilter
  courseId: string | null
  classId: string | null
  unitId: string | null
  enrollmentDateFrom: string | null
  enrollmentDateTo: string | null
  /** Somente gerente pode filtrar por vendedor (mesmo padrão do módulo de Alunos). */
  sellerId: string | null
  sortBy: EnrollmentSortBy
  page: number
  pageSize: number
}

/** Indicadores da listagem de Matrículas (cards no topo da página). */
export interface EnrollmentsOverview {
  total: number
  active: number
  completed: number
  cancelled: number
}

/** Aluno enxuto para o seletor de aluno do formulário de nova matrícula. */
export interface StudentOption {
  id: string
  full_name: string
  cpf: string | null
  email: string | null
}

/**
 * Leitura auxiliar só para a seção "Informações comerciais" do detalhe da
 * matrícula — não é o módulo de Vendas (deliberadamente não implementado
 * nesta fase). sales.enrollment_id é UNIQUE (1 venda por matrícula), então
 * isto é sempre 0 ou 1 registro.
 */
export interface EnrollmentSaleSummary {
  id: string
  total_amount: number
  payment_method: string
  sale_date: string
}
