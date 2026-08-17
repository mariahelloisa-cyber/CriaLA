import type { ClassStatus, Course } from './classes'

export type { Course, CourseCategory } from './classes'

/** public.courses + categoria embutida. Estende o Course "enxuto" (id/name/category) já usado nos dropdowns de Alunos/Turmas com os campos que só o módulo de Cursos precisa. */
export interface CourseListItem extends Course {
  description: string | null
  is_active: boolean
  total_units: number | null
}

export interface CourseDetail extends CourseListItem {
  created_at: string
  updated_at: string
}

export interface CreateCourseInput {
  name: string
  category_id: string
  description?: string | null
  is_active: boolean
  total_units?: number | null
}

export type UpdateCourseInput = Partial<CreateCourseInput>

export type CourseStatusFilter = 'all' | 'active' | 'inactive'

export type CourseSortBy = 'recent' | 'name'

export interface CourseFilters {
  search: string
  status: CourseStatusFilter
  categoryId: string | null
  sortBy: CourseSortBy
  page: number
  pageSize: number
}

/** Indicadores do topo da listagem de Cursos — uma única leitura agregada, sem query por card. */
export interface CoursesOverview {
  total: number
  active: number
  categories: number
  /** Matrículas em turmas com status "Em andamento" (public.classes.status = 'in_progress'). */
  activeClassEnrollments: number
}

/** Resumo de turma para a seção "Turmas associadas" do detalhe do curso. */
export interface CourseClassSummary {
  id: string
  name: string
  status: ClassStatus
}
