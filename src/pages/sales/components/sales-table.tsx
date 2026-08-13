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
import { formatCentsToBRL } from '@/utils/currency'
import { formatDateBr } from '@/utils/format-date'
import type { SaleListItem } from '@/types/sales'
import { PaymentMethodBadge } from './sale-badges'

interface SalesTableProps {
  items: SaleListItem[]
  isManager: boolean
  onDelete: (item: SaleListItem) => void
  className?: string
}

const HEAD_CLASS = 'uppercase tracking-wide text-caption'
const CELL_CLASS = 'py-4 text-body'

function money(reais: number) {
  return formatCentsToBRL(Math.round(reais * 100))
}

/**
 * Layout pedido pelo usuário (referência visual) — mesma convenção "limpa e
 * espaçada" já estabelecida em students-table.tsx (sem moldura externa,
 * header sem faixa cinza, linhas altas, texto principal em text-body). A
 * coluna "Situação" existente não aparece na referência — removida só desta
 * tabela; `situacao`/`SaleSituationBadge` continuam intactos em
 * `sales-cards.tsx` (mobile, não alterado nesta tarefa).
 */
export function SalesTable({ items, isManager, onDelete, className }: SalesTableProps) {
  return (
    <Table className={className} wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className={`${HEAD_CLASS} min-w-[180px]`}>Aluno</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[180px]`}>Curso</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[150px]`}>Pagamento</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[100px]`}>Data</TableHead>
          {isManager && <TableHead className={`${HEAD_CLASS} min-w-[140px]`}>Vendedor</TableHead>}
          <TableHead className={`${HEAD_CLASS} min-w-[110px]`}>Valor total</TableHead>
          <TableHead className={`${HEAD_CLASS} min-w-[110px]`}>Apurado</TableHead>
          <TableHead className={`${HEAD_CLASS} w-12 text-right`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className={CELL_CLASS}>
              <Link to={ROUTES.saleDetail(item.id)} className="font-medium text-foreground hover:underline">
                {item.student.full_name}
              </Link>
            </TableCell>
            <TableCell className={CELL_CLASS}>
              <div className="flex flex-col">
                <span className="text-foreground">{item.course.name}</span>
                <span className="text-caption text-muted-foreground">{item.course.category?.name ?? '—'}</span>
              </div>
            </TableCell>
            <TableCell className={CELL_CLASS}>
              <div className="flex flex-col gap-1">
                <PaymentMethodBadge method={item.payment_method} className="w-fit rounded-full" />
                <span className="text-caption text-muted-foreground">
                  {item.installmentCount <= 1
                    ? 'Pagamento único'
                    : `${item.installmentCount}x de ${money(item.installmentAmount)}`}
                </span>
              </div>
            </TableCell>
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{formatDateBr(item.sale_date)}</TableCell>
            {isManager && (
              <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{item.seller?.full_name ?? '—'}</TableCell>
            )}
            <TableCell className={`${CELL_CLASS} text-muted-foreground`}>{money(item.total_amount)}</TableCell>
            <TableCell className={`${CELL_CLASS} font-semibold text-foreground`}>{money(item.goal_amount)}</TableCell>
            <TableCell className="py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações da venda de ${item.student.full_name}`} variant="ghost">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.saleDetail(item.id)}>
                      <Eye className="size-4" aria-hidden="true" />
                      Visualizar
                    </Link>
                  </DropdownMenuItem>
                  {isManager && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={ROUTES.saleEdit(item.id)}>
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
