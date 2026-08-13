/**
 * Espelha public.enrollments.status e public.classes.status
 * (supabase/migrations/20260811120000_extensions_and_enums.sql).
 */
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'
export type ClassStatus = 'open' | 'in_progress' | 'closed'

/** public.course_categories */
export interface CourseCategory {
  id: string
  name: string
  slug: string
}

/** public.courses, com a categoria embutida (join via category_id). */
export interface Course {
  id: string
  name: string
  category: CourseCategory | null
}

/** public.units */
export interface Unit {
  id: string
  name: string
}

/** public.classes, com curso e unidade embutidos. */
export interface ClassOption {
  id: string
  name: string
  status: ClassStatus
  start_date: string
  end_date: string
  capacity: number | null
  course: Course | null
  unit: Unit | null
}

/** public.students — 1:1 com as colunas reais da tabela. */
export interface Student {
  id: string
  full_name: string
  birth_date: string | null
  father_name: string | null
  mother_name: string | null
  rg: string | null
  cpf: string | null
  phone: string | null
  email: string | null
  cep: string | null
  address: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/** public.enrollments, com a turma (e curso/categoria/unidade) embutidos. */
export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  enrollment_date: string
  expected_graduation_date: string | null
  status: EnrollmentStatus
  created_by: string
  class: ClassOption | null
}

/**
 * Uma linha da listagem: dados essenciais do aluno + a matrícula mais
 * recente (query com raiz em `enrollments`, não em `students` — students não
 * tem FK direta para classes, a relação é só via enrollments).
 */
export interface StudentListItem {
  enrollmentId: string
  enrollmentStatus: EnrollmentStatus
  enrollmentDate: string
  expectedGraduationDate: string | null
  student: {
    id: string
    full_name: string
    email: string | null
    cpf: string | null
    phone: string | null
    created_by: string
    /** Vendedor dono do aluno (join students.created_by -> profiles), exibido só para gerente. */
    seller: { id: string; full_name: string } | null
  }
  class: ClassOption | null
}

/** Aluno + todas as suas matrículas (para a página de detalhe). */
export interface StudentDetail extends Student {
  enrollments: Enrollment[]
}

export interface CreateStudentInput {
  full_name: string
  birth_date?: string | null
  father_name?: string | null
  mother_name?: string | null
  rg?: string | null
  cpf?: string | null
  phone?: string | null
  email?: string | null
  cep?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
}

export interface CreateEnrollmentInput {
  class_id: string
  enrollment_date?: string
  expected_graduation_date?: string | null
}

export type UpdateStudentInput = Partial<CreateStudentInput>

export interface UpdateEnrollmentInput {
  class_id?: string
  enrollment_date?: string
  expected_graduation_date?: string | null
  /** Adicionado na Fase 10 (módulo de Matrículas) — updateEnrollment() já repassava `input` genericamente, então nenhuma mudança de lógica foi necessária. */
  status?: EnrollmentStatus
}

/**
 * Abas da listagem. Mapeiam 1:1 para public.enrollment_status — sem inventar
 * um estado "em formação" que não existe no enum (ver relatório da fase).
 */
export type StudentStatusFilter = 'all' | EnrollmentStatus

export interface StudentFilters {
  search: string
  courseId: string | null
  categoryId: string | null
  classId: string | null
  unitId: string | null
  enrollmentDateFrom: string | null
  enrollmentDateTo: string | null
  status: StudentStatusFilter
  /** Somente gerente pode filtrar por vendedor. */
  sellerId: string | null
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
