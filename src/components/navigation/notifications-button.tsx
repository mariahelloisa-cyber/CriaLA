import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'

interface NotificationsButtonProps {
  hasUnread?: boolean
}

/**
 * Área de notificações preparada visualmente. Nenhuma notificação real é
 * buscada/entregue nesta fase — a lista fica sempre vazia (ver EmptyState).
 */
export function NotificationsButton({ hasUnread = false }: NotificationsButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="relative inline-flex">
          <IconButton
            label="Notificações"
            variant="ghost"
            className="hover:bg-brand-pink-soft hover:text-primary"
          >
            <Bell className="size-[18px]" aria-hidden="true" />
          </IconButton>
          {hasUnread && (
            <span
              className={cn('absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card')}
              aria-hidden="true"
            />
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
          <p className="text-body-sm font-medium text-foreground">Nenhuma notificação</p>
          <p className="text-caption text-muted-foreground">
            Você será avisado aqui sobre novidades importantes.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
