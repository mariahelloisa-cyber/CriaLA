import { Eye, KeyRound, MoreHorizontal, Pencil, Power, PowerOff, Target, TrendingUp } from 'lucide-react'
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
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'
import { ROUTES } from '@/constants/routes'
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerListItem } from '@/types/sellers'

interface SellersCardsProps {
  items: SellerListItem[]
  onEdit: (seller: SellerListItem) => void
  onResetPassword: (seller: SellerListItem) => void
  onToggleStatus: (seller: SellerListItem) => void
  className?: string
}

/** Fallback mobile (<lg) da SellersTable — mesmo padrão de CoursesCards/StudentsCards. */
export function SellersCards({ items, onEdit, onResetPassword, onToggleStatus, className }: SellersCardsProps) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {items.map((seller) => (
          <li key={seller.id}>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link to={ROUTES.sellerDetail(seller.id)} className="flex min-w-0 items-center gap-3">
                  <Avatar name={seller.full_name} size="sm" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground hover:underline">{seller.full_name}</span>
                    <span className="truncate text-caption text-muted-foreground">{seller.email ?? '—'}</span>
                  </div>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton label={`Ações de ${seller.full_name}`} variant="ghost" className="shrink-0">
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
                    <DropdownMenuItem onSelect={() => onResetPassword(seller)}>
                      <KeyRound className="size-4" aria-hidden="true" />
                      Alterar senha
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
              </div>

              <ActiveStatusBadge isActive={seller.is_active} />

              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">Alunos</span>
                  <span className="text-foreground">{seller.studentsCount}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">Matrículas</span>
                  <span className="text-foreground">{seller.enrollmentsCount}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">Valor vendido</span>
                  <span className="text-foreground">{formatCentsToBRL(Math.round(seller.realizedAmount * 100))}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">Meta</span>
                  <span className="text-foreground">
                    {seller.goal ? formatCentsToBRL(Math.round(seller.goal.financial_target * 100)) : 'Sem meta'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">% da meta</span>
                  <span className="text-foreground">{seller.goal ? `${Math.round(seller.financialPercent)}%` : '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-caption text-muted-foreground">Ranking</span>
                  <span className="text-foreground">{seller.rank ? `${seller.rank}º de ${seller.totalSellers}` : '—'}</span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
