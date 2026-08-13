import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { ROUTES } from '@/constants/routes'
import { formatDateBr } from '@/utils/format-date'
import type { EnrollmentListItem } from '@/types/enrollments'
import { EnrollmentStatusBadge } from '@/pages/students/components/status-badges'

interface EnrollmentsCardsProps {
  items: EnrollmentListItem[]
  isManager: boolean
  onDelete: (item: EnrollmentListItem) => void
  className?: string
}

export function EnrollmentsCards({ items, isManager, onDelete, className }: EnrollmentsCardsProps) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex items-start gap-3 p-4">
              <Link to={ROUTES.studentDetail(item.student.id)} className="shrink-0">
                <Avatar name={item.student.full_name} size="md" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={ROUTES.studentDetail(item.student.id)} className="min-w-0">
                    <p className="truncate font-medium text-foreground hover:underline">{item.student.full_name}</p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton
                        label={`Ações da matrícula de ${item.student.full_name}`}
                        variant="ghost"
                        className="shrink-0"
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={ROUTES.enrollmentDetail(item.id)}>
                          <Eye className="size-4" aria-hidden="true" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      {isManager && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={ROUTES.enrollmentEdit(item.id)}>
                              <Pencil className="size-4" aria-hidden="true" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => onDelete(item)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="truncate text-body-sm text-muted-foreground">
                  {item.class?.course?.name ?? 'Sem curso'} · {item.class?.name ?? 'Sem turma'}
                </p>
                <p className="truncate text-caption text-muted-foreground">{item.class?.unit?.name ?? '—'}</p>

                <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                  <span>Matrícula: {formatDateBr(item.enrollmentDate)}</span>
                  <EnrollmentStatusBadge status={item.status} />
                </div>
                {isManager && item.student.seller && (
                  <p className="text-caption text-muted-foreground">Vendedor: {item.student.seller.full_name}</p>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
