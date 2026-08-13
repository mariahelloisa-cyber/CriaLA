import { Eye, MoreHorizontal, Pencil, Power, PowerOff, Target, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
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
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerListItem } from '@/types/sellers'

interface SellersTableProps {
  items: SellerListItem[]
  onEdit: (seller: SellerListItem) => void
  onToggleStatus: (seller: SellerListItem) => void
  className?: string
}

const HEAD_CLASS = 'uppercase tracking-wide text-caption'
const CELL_CLASS = 'py-4 text-body-sm'

/** Mesmo padrão de tabela já usado em Matrículas/Alunos (Fase 10/21): colunas com min-w + scroll horizontal, nunca table-fixed em tabelas com muitas colunas. */
export function SellersTable({ items, onEdit, onToggleStatus, className }: SellersTableProps) {
  return (
    <Table className={className} wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className={`${HEAD_CLASS} min-w-[180px]`}>Nome</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[200px]`}>E-mail</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Status</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Alunos</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Matrículas</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[140px]`}>Valor vendido</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[140px]`}>Meta</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>% da meta</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[120px]`}>Ranking</TableHead>
          <TableHead className={`${HEAD_CLASS} w-12 text-right`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((seller) => (
          <TableRow key={seller.id}>
            <TableCell className={CELL_CLASS}>
              <Link
                to={ROUTES.sellerDetail(seller.id)}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar name={seller.full_name} size="sm" />
                <span className="font-medium text-foreground">{seller.full_name}</span>
              </Link>
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{seller.email ?? '—'}</TableCell>
            <TableCell className={CELL_CLASS}>
              <ActiveStatusBadge isActive={seller.is_active} />
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{seller.studentsCount}</TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{seller.enrollmentsCount}</TableCell>
            <TableCell className={`${CELL_CLASS} text-foreground`}>
              {formatCentsToBRL(Math.round(seller.realizedAmount * 100))}
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>
              {seller.goal ? formatCentsToBRL(Math.round(seller.goal.financial_target * 100)) : 'Sem meta'}
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>
              {seller.goal ? `${Math.round(seller.financialPercent)}%` : '—'}
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>
              {seller.rank ? `${seller.rank}º de ${seller.totalSellers}` : '—'}
            </TableCell>
            <TableCell className="py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${seller.full_name}`} variant="ghost">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.sellerDetail(seller.id)}>
                      <Eye className="size-4" aria-hidden="true" />
                      Ver detalhes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onEdit(seller)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onToggleStatus(seller)}>
                    {seller.is_active ? (
                      <PowerOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Power className="size-4" aria-hidden="true" />
                    )}
                    {seller.is_active ? 'Desativar' : 'Ativar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`${ROUTES.reports}?vendedor=${seller.id}`}>
                      <TrendingUp className="size-4" aria-hidden="true" />
                      Ver desempenho
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`${ROUTES.goals}?vendedor=${seller.id}`}>
                      <Target className="size-4" aria-hidden="true" />
                      Ver metas
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
