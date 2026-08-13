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
import { formatCentsToBRL } from '@/utils/currency'
import { formatDateBr } from '@/utils/format-date'
import type { SaleListItem } from '@/types/sales'
import { PAYMENT_METHOD_LABEL, SaleSituationBadge } from './sale-badges'

interface SalesCardsProps {
  items: SaleListItem[]
  isManager: boolean
  onDelete: (item: SaleListItem) => void
  className?: string
}

export function SalesCards({ items, isManager, onDelete, className }: SalesCardsProps) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex items-start gap-3 p-4">
              <Link to={ROUTES.saleDetail(item.id)} className="shrink-0">
                <Avatar name={item.student.full_name} size="md" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={ROUTES.saleDetail(item.id)} className="min-w-0">
                    <p className="truncate font-medium text-foreground hover:underline">{item.student.full_name}</p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton
                        label={`Ações da venda de ${item.student.full_name}`}
                        variant="ghost"
                        className="shrink-0"
                      >
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
                </div>

                <p className="truncate text-body-sm text-muted-foreground">{item.course.name}</p>

                <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                  <span>{formatDateBr(item.sale_date)}</span>
                  <span>·</span>
                  <span>{PAYMENT_METHOD_LABEL[item.payment_method]}</span>
                  <span>·</span>
                  <span className="font-medium text-foreground">
                    {formatCentsToBRL(Math.round(item.total_amount * 100))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SaleSituationBadge situacao={item.situacao} />
                  {isManager && item.seller && (
                    <span className="text-caption text-muted-foreground">Vendedor: {item.seller.full_name}</span>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
