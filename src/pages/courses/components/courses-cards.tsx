import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
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
import type { CourseListItem } from '@/types/courses'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'

interface CoursesCardsProps {
  items: CourseListItem[]
  isManager: boolean
  onDelete: (item: CourseListItem) => void
  className?: string
}

export function CoursesCards({ items, isManager, onDelete, className }: CoursesCardsProps) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link to={ROUTES.courseDetail(item.id)} className="min-w-0">
                  <p className="truncate font-medium text-foreground hover:underline">{item.name}</p>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton label={`Ações de ${item.name}`} variant="ghost" className="shrink-0">
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.courseDetail(item.id)}>
                        <Eye className="size-4" aria-hidden="true" />
                        Visualizar
                      </Link>
                    </DropdownMenuItem>
                    {isManager && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={ROUTES.courseEdit(item.id)}>
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

              <p className="truncate text-body-sm text-muted-foreground">{item.category?.name ?? 'Sem categoria'}</p>

              <ActiveStatusBadge isActive={item.is_active} />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
