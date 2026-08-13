import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

export interface UserMenuUser {
  name: string
  role: string
  email?: string
  avatarUrl?: string
}

interface UserMenuProps {
  /** null enquanto o profile ainda está carregando — mostra skeleton. */
  user: UserMenuUser | null
}

export function UserMenu({ user }: UserMenuProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-1 pr-2">
        <Skeleton className="size-8 rounded-full" />
        <div className="hidden flex-col gap-1 sm:flex">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
    )
  }

  async function handleSignOut() {
    await signOut()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="text-body-sm font-medium text-foreground">{user.name}</span>
            <span className="text-caption text-muted-foreground">{user.role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-body-sm font-medium text-foreground">{user.name}</span>
          <span className="text-caption font-normal text-muted-foreground">{user.email ?? user.role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleSignOut()}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
