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
import { formatCpf } from '@/utils/cpf'
import { formatDateBr } from '@/utils/format-date'
import { formatPhone } from '@/utils/masks'
import type { StudentListItem } from '@/types/students'
import { EnrollmentStatusBadge } from './status-badges'

interface StudentsTableProps {
  items: StudentListItem[]
  isManager: boolean
  onDelete: (item: StudentListItem) => void
  className?: string
}

const HEAD_CLASS = 'uppercase tracking-wide text-caption'
const CELL_CLASS = 'py-4 text-body'

/**
 * Layout pedido pelo usuário (referência visual): visual "limpo e espaçado",
 * não a aparência genérica de tabela shadcn/Radix — moldura removida via
 * `wrapperClassName` (Table continua sendo a mesma usada em todo o projeto,
 * só esta instância não tem a caixa/borda ao redor), header sem faixa
 * cinza, linhas mais altas (py-4) e texto principal em `text-body` (16px)
 * em vez do `text-body-sm` padrão da tabela. Mobile continua com
 * `StudentsCards` (não alterado) e scroll horizontal (comportamento já
 * existente do wrapper de Table, não removido).
 */
export function StudentsTable({ items, isManager, onDelete, className }: StudentsTableProps) {
  return (
    <Table className={className} wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className={`${HEAD_CLASS} min-w-[200px]`}>Aluno</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[180px]`}>Curso / Categoria</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[120px]`}>Turma</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Matrícula</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[130px]`}>Formação prevista</TableHead>
          {isManager && <TableHead className={`${HEAD_CLASS} min-w-[140px]`}>Vendedor</TableHead>}
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Status</TableHead>
          <TableHead className={`${HEAD_CLASS} w-12 text-right`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.enrollmentId}>
            <TableCell className={CELL_CLASS}>
              <Link to={ROUTES.studentDetail(item.student.id)} className="flex min-w-0 flex-col hover:underline">
                <span className="truncate font-medium text-foreground">{item.student.full_name}</span>
                <span className="truncate text-caption text-muted-foreground">
                  {item.student.cpf ? formatCpf(item.student.cpf) : '—'}
                  {item.student.phone ? ` · ${formatPhone(item.student.phone)}` : ''}
                </span>
              </Link>
            </TableCell>
            <TableCell className={CELL_CLASS}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-foreground">{item.class?.course?.name ?? '—'}</span>
                <span className="truncate text-caption text-muted-foreground">
                  {item.class?.course?.category?.name ?? '—'}
                </span>
              </div>
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{item.class?.name ?? '—'}</TableCell>
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
              <EnrollmentStatusBadge status={item.enrollmentStatus} className="rounded-full" />
            </TableCell>
            <TableCell className="py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${item.student.full_name}`} variant="ghost">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
