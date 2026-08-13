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
import type { UnitListItem } from '@/types/units'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'

interface UnitsTableProps {
  items: UnitListItem[]
  isManager: boolean
  onDelete: (item: UnitListItem) => void
  className?: string
}

const HEAD_CLASS = 'uppercase tracking-wide text-caption'
const CELL_CLASS = 'py-4 text-body'

export function UnitsTable({ items, isManager, onDelete, className }: UnitsTableProps) {
  return (
    <Table className={className} wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className={`${HEAD_CLASS} min-w-[220px]`}>Unidade</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Status</TableHead>
          <TableHead className={`${HEAD_CLASS} w-12 text-right`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className={CELL_CLASS}>
              <Link to={ROUTES.unitDetail(item.id)} className="font-medium text-foreground hover:underline">
                {item.name}
              </Link>
            </TableCell>
            <TableCell className="py-4">
              <ActiveStatusBadge isActive={item.is_active} className="rounded-full" />
            </TableCell>
            <TableCell className="py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${item.name}`} variant="ghost">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.unitDetail(item.id)}>
                      <Eye className="size-4" aria-hidden="true" />
                      Visualizar
                    </Link>
                  </DropdownMenuItem>
                  {isManager && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={ROUTES.unitEdit(item.id)}>
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
