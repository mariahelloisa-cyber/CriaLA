import { CalendarClock, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { formatDateBr } from '@/utils/format-date'
import type { UpcomingGraduation } from '@/types/dashboard'

/** "Próximas Formaturas" (PDF seção 7) — próximos 90 dias, matrículas ativas (ver services/dashboard.service.ts). */
export function UpcomingGraduationsList({ items }: { items: UpcomingGraduation[] }) {
  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-body">Próximas formaturas</CardTitle>
        <CardDescription className="text-caption">Base para campanhas de renovação</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        {items.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden="true" />}
            title="Nenhuma formatura nos próximos 90 dias"
            description="Alunos com previsão de formação neste período aparecerão aqui."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.enrollmentId} className="flex items-center justify-between gap-3">
                <Link
                  to={ROUTES.studentDetail(item.studentId)}
                  className="flex min-w-0 items-center gap-2 text-body-sm font-medium text-foreground hover:underline"
                >
                  <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">{item.studentName}</span>
                </Link>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-caption text-muted-foreground">{item.courseName ?? '—'}</span>
                  <span className="text-caption text-foreground">{formatDateBr(item.expectedGraduationDate)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
