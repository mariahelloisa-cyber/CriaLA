import { Menu } from 'lucide-react'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/navigation/breadcrumbs'
import { CommandSearch } from '@/components/navigation/command-search'
import { NotificationsButton } from '@/components/navigation/notifications-button'
import { UserMenu, type UserMenuUser } from '@/components/navigation/user-menu'
import { IconButton } from '@/components/ui/icon-button'

interface HeaderProps {
  breadcrumbItems?: BreadcrumbItem[]
  onOpenMobileMenu: () => void
  user: UserMenuUser | null
}

export function Header({ breadcrumbItems = [], onOpenMobileMenu, user }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <IconButton label="Abrir menu" variant="ghost" className="lg:hidden" onClick={onOpenMobileMenu}>
        <Menu className="size-[18px]" aria-hidden="true" />
      </IconButton>

      <Breadcrumbs items={breadcrumbItems} className="hidden sm:flex" />

      <div className="ml-auto flex items-center gap-1.5">
        <CommandSearch />
        <NotificationsButton />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
