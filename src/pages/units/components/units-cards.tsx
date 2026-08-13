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
import type { UnitListItem } from '@/types/units'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'

interface UnitsCardsProps {
  items: UnitListItem[]
  isManager: boolean
  onDelete: (item: UnitListItem) => void
  className?: string
}

export function UnitsCards({ items, isManager, onDelete, className }: UnitsCardsProps) {
  return (
    <div className={className}>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex items-center justify-between gap-2 p-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <Link to={ROUTES.unitDetail(item.id)} className="min-w-0">
                  <p className="truncate font-medium text-foreground hover:underline">{item.name}</p>
                </Link>
                <ActiveStatusBadge isActive={item.is_active} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${item.name}`} variant="ghost" className="shrink-0">
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
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
