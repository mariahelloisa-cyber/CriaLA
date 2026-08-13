import { CalendarRange, Eye, MapPin, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { formatDateBr } from '@/utils/format-date'
import type { ClassListItem } from '@/types/classes'
import { ClassStatusBadge } from '@/pages/students/components/status-badges'

interface ClassesCardsProps {
  items: ClassListItem[]
  isManager: boolean
  onDelete: (item: ClassListItem) => void
  /** Matrículas por turma (id → contagem), buscadas em uma única query pela página — ver classes-page.tsx. */
  enrolledCounts: Record<string, number>
  className?: string
}

/**
 * Grade de cards (pedido do usuário, com referência visual + código-fonte)
 * substituindo a tabela + lista mobile anteriores em todas as larguras de
 * tela. "Ocupação" (matriculados/vagas) só aparece quando `capacity` está
 * definido — turmas cadastradas antes da migration de capacity (nullable)
 * ficam sem essa linha em vez de mostrar um denominador inventado.
 */
export function ClassesCards({ items, isManager, onDelete, enrolledCounts, className }: ClassesCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', className)}>
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col gap-4 rounded-lg p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={ROUTES.classDetail(item.id)}
                className="block truncate text-body font-bold text-foreground hover:underline"
              >
                {item.name}
              </Link>
              <p className="truncate text-body-sm text-muted-foreground">{item.course?.name ?? 'Sem curso'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ClassStatusBadge status={item.status} className="rounded-full" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${item.name}`} variant="ghost" className="shrink-0">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.classDetail(item.id)}>
                      <Eye className="size-4" aria-hidden="true" />
                      Visualizar
                    </Link>
                  </DropdownMenuItem>
                  {isManager && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={ROUTES.classEdit(item.id)}>
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
          </div>

          <div className="flex flex-col gap-1.5 text-caption text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {item.unit?.name ?? 'Sem unidade'}
            </span>
            <span className="flex items-center gap-2">
              <CalendarRange className="size-3.5 shrink-0" aria-hidden="true" />
              {formatDateBr(item.start_date)} até {formatDateBr(item.end_date)}
            </span>
          </div>

          {item.capacity != null &&
            (() => {
              const enrolled = enrolledCounts[item.id] ?? 0
              const percent = Math.round((enrolled / item.capacity) * 100)
              return (
                <div>
                  <div className="flex items-baseline justify-between text-caption">
                    <span className="text-muted-foreground">Ocupação</span>
                    <span className="font-semibold text-foreground">
                      {enrolled}/{item.capacity} vagas
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={percent}
                      showValue={false}
                      indicatorClassName={percent >= 100 ? 'bg-success' : percent >= 60 ? 'bg-primary' : 'bg-warning'}
                    />
                  </div>
                </div>
              )
            })()}

          <Badge variant="neutral" className="w-fit rounded-full">
            {item.course?.category?.name ?? 'Sem categoria'}
          </Badge>
        </Card>
      ))}
    </div>
  )
}
