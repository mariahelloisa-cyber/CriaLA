import { todayIso } from './format-date'
import type { EnrollmentStatus } from '@/types/students'

/**
 * Fase 24 — regra única de "matrícula ativa" / "formação próxima" / "formado",
 * antes duplicada (mesmo critério, código repetido) entre
 * academic-reports.service.ts (relatório) e dashboard.service.ts (indicador
 * do Dashboard). Nenhuma fórmula nova: `GRADUATION_WINDOW_DAYS=90` e os 3
 * status usados já eram exatamente os mesmos nos dois lugares (ver
 * relatório final da Fase 24) — esta extração só elimina o risco de um
 * futuro ajuste (ex.: mudar a janela de 90 para 60 dias) ser feito em um
 * arquivo e esquecido no outro.
 */
export const GRADUATION_WINDOW_DAYS = 90

/** Janela [hoje, hoje+90d] usada tanto pela query do Dashboard (.gte/.lte) quanto pelo filtro em memória do relatório. */
export function graduationWindowRange(): { from: string; to: string } {
  const from = todayIso()
  const to = new Date(Date.now() + GRADUATION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { from, to }
}

/** "Alunos em Formação" = matrículas com status ativo (enrollment_status = 'active'). */
export function isActiveEnrollment(status: EnrollmentStatus): boolean {
  return status === 'active'
}

/** "Formação Próxima" = ativa + expected_graduation_date dentro da janela de 90 dias. */
export function isUpcomingGraduation(status: EnrollmentStatus, expectedGraduationDate: string | null): boolean {
  if (!isActiveEnrollment(status) || !expectedGraduationDate) return false
  const { from, to } = graduationWindowRange()
  return expectedGraduationDate >= from && expectedGraduationDate <= to
}

/** "Alunos Formados" = enrollment_status = 'completed', único status explícito de conclusão no schema. */
export function isGraduatedEnrollment(status: EnrollmentStatus): boolean {
  return status === 'completed'
}
