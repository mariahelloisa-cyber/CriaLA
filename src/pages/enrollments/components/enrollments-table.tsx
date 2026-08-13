import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { ROUTES } from '@/constants/routes'
import { formatDateBr } from '@/utils/format-date'
import type { EnrollmentListItem } from '@/types/enrollments'
import { EnrollmentStatusBadge } from '@/pages/students/components/status-badges'

interface EnrollmentsTableProps {
  items: EnrollmentListItem[]
  isManager: boolean
  onDelete: (item: EnrollmentListItem) => void
  className?: string
}

const HEAD_CLASS = 'uppercase tracking-wide text-caption'
const CELL_CLASS = 'py-4 text-body'

export function EnrollmentsTable({ items, isManager, onDelete, className }: EnrollmentsTableProps) {
  return (
    <Table className={className} wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className={`${HEAD_CLASS} min-w-[180px]`}>Aluno</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[160px]`}>Curso</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[120px]`}>Turma</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[120px]`}>Unidade</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Matrícula</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[140px]`}>Previsão de formação</TableHead>
          {isManager && <TableHead className={`${HEAD_CLASS} min-w-[140px]`}>Vendedor</TableHead>}
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Status</TableHead>
          <TableHead className={`${HEAD_CLASS} w-12 text-right`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className={CELL_CLASS}>
              <Link to={ROUTES.studentDetail(item.student.id)} className="font-medium text-foreground hover:underline">
                {item.student.full_name}
              </Link>
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{item.class?.course?.name ?? '—'}</TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{item.class?.name ?? '—'}</TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{item.class?.unit?.name ?? '—'}</TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{formatDateBr(item.enrollmentDate)}</TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>
              {formatDateBr(item.expectedGraduationDate)}
            </TableCell>
            {isManager && (
              <TableCell className={`${CELL_CLASS} text-muted-foreground`}>
                {item.student.seller?.full_name ?? '—'}
              </TableCell>
            )}
            <TableCell className="py-4">
              <EnrollmentStatusBadge status={item.status} className="rounded-full" />
            </TableCell>
            <TableCell className="py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações da matrícula de ${item.student.full_name}`} variant="ghost">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
