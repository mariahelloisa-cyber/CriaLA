/**
 * Indicadores exclusivos do Dashboard do Gerente que não existem em nenhum
 * service anterior (PDF seção 7: Total de Matrículas, Alunos em Formação,
 * Próximas Formaturas, Quantidade de Alunos por Categoria). Meta
 * financeira/realizado/ranking/Metas da Empresa/Metas por Vendedor são 100%
 * reaproveitados de goals.service.ts (types/goals.ts:SellerGoalSummary) —
 * não duplicados aqui.
 */
export interface UpcomingGraduation {
  enrollmentId: string
  studentId: string
  studentName: string
  expectedGraduationDate: string
  courseName: string | null
}

export interface CategoryStudentCount {
  category: { id: string; name: string } | null
  studentCount: number
}

/** Indicadores acadêmicos "estado atual" (não filtrados por período — ver relatório final da Fase 14). */
export interface ManagerAcademicSnapshot {
  totalEnrollments: number
  activeEnrollments: number
  sellerCount: number
  upcomingGraduations: UpcomingGraduation[]
  studentsByCategory: CategoryStudentCount[]
}

/** Quantidade de matrículas (registros de `enrollments`, por `enrollment_date`) em um mês — usado pelo card "Matrículas por mês". */
export interface EnrollmentsByMonth {
  month: number
  year: number
  count: number
}
