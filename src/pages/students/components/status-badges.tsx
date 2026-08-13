import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ClassStatus, EnrollmentStatus } from '@/types/students'

/**
 * "active" exibido como "Em formação" (pedido do usuário, referência
 * visual) — só o texto/cor do badge mudou, o enum `public.enrollment_status`
 * continua com os mesmos 3 valores (active/completed/cancelled), nenhum
 * estado novo foi inventado.
 */
const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  active: 'Em formação',
  completed: 'Formado',
  cancelled: 'Cancelada',
}

const ENROLLMENT_STATUS_VARIANT: Record<EnrollmentStatus, 'primary' | 'info' | 'danger'> = {
  active: 'primary',
  completed: 'info',
  cancelled: 'danger',
}

const ENROLLMENT_STATUS_DOT: Record<EnrollmentStatus, string> = {
  active: 'bg-primary',
  completed: 'bg-info',
  cancelled: 'bg-destructive',
}

export function EnrollmentStatusBadge({ status, className }: { status: EnrollmentStatus; className?: string }) {
  return (
    <Badge variant={ENROLLMENT_STATUS_VARIANT[status]} className={cn('gap-1.5', className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', ENROLLMENT_STATUS_DOT[status])} aria-hidden="true" />
      {ENROLLMENT_STATUS_LABEL[status]}
    </Badge>
  )
}

const CLASS_STATUS_LABEL: Record<ClassStatus, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  closed: 'Encerrada',
}

const CLASS_STATUS_VARIANT: Record<ClassStatus, 'success' | 'info' | 'neutral'> = {
  open: 'success',
  in_progress: 'info',
  closed: 'neutral',
}

export function ClassStatusBadge({ status, className }: { status: ClassStatus; className?: string }) {
  return (
    <Badge variant={CLASS_STATUS_VARIANT[status]} className={className}>
      {CLASS_STATUS_LABEL[status]}
    </Badge>
  )
}

export { ENROLLMENT_STATUS_LABEL, CLASS_STATUS_LABEL }
