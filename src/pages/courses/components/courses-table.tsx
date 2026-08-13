import { BookOpen, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import type { CourseListItem } from '@/types/courses'

interface CoursesTableProps {
  items: CourseListItem[]
  isManager: boolean
  onDelete: (item: CourseListItem) => void
  className?: string
}

const HEAD_CLASS = 'uppercase tracking-wide text-caption px-20'
const CELL_CLASS = 'px-20 py-3 text-body-sm'

export function CoursesTable({ items, isManager, onDelete, className }: CoursesTableProps) {
  return (
    <Table className={cn('table-fixed', className)} wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className={`${HEAD_CLASS} w-[35%]`}>Curso</TableHead>
          <TableHead className={`${HEAD_CLASS} w-[30%]`}>Categoria</TableHead>
          <TableHead className={`${HEAD_CLASS} w-[20%]`}>Status</TableHead>
          <TableHead className={`${HEAD_CLASS} w-[15%] text-right`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className={CELL_CLASS}>
              <Link to={ROUTES.courseDetail(item.id)} className="flex min-w-0 items-center gap-3 hover:underline">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-pink-soft text-primary">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                </span>
                <span className="truncate font-medium text-foreground">{item.name}</span>
              </Link>
            </TableCell>
            <TableCell className={`${CELL_CLASS} truncate text-muted-foreground`}>
              {item.category?.name ?? '—'}
            </TableCell>
            <TableCell className={CELL_CLASS}>
              <ActiveStatusBadge isActive={item.is_active} />
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-right`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${item.name}`} variant="ghost">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
