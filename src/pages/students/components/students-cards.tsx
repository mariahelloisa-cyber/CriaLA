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
import type { StudentListItem } from '@/types/students'
import { EnrollmentStatusBadge } from './status-badges'

interface StudentsCardsProps {
  items: StudentListItem[]
  isManager: boolean
  onDelete: (item: StudentListItem) => void
  className?: string
}

export function StudentsCards({ items, isManager, onDelete, className }: StudentsCardsProps) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.enrollmentId}>
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
                      <IconButton label={`Ações de ${item.student.full_name}`} variant="ghost" className="shrink-0">
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={ROUTES.studentDetail(item.student.id)}>
                          <Eye className="size-4" aria-hidden="true" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={ROUTES.studentEdit(item.student.id)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      {isManager && (
                        <>
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

                <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                  <span>Matrícula: {formatDateBr(item.enrollmentDate)}</span>
                  <EnrollmentStatusBadge status={item.enrollmentStatus} />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
