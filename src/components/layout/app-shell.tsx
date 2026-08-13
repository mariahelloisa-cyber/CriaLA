import type { ReactNode } from 'react'
import { MobileSidebar } from '@/components/navigation/mobile-sidebar'
import { Sidebar } from '@/components/navigation/sidebar'
import type { BreadcrumbItem } from '@/components/navigation/breadcrumbs'
import type { UserMenuUser } from '@/components/navigation/user-menu'
import { useSidebarState } from '@/hooks/useSidebarState'
import { Header } from './header'

interface AppShellProps {
  children: ReactNode
  breadcrumbItems?: BreadcrumbItem[]
  user: UserMenuUser | null
}

/**
 * Estrutura principal do sistema: Sidebar + Header + área de conteúdo.
 * Ocupa toda a viewport; a Sidebar vira Drawer em telas menores que `lg`.
 */
export function AppShell({ children, breadcrumbItems, user }: AppShellProps) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header breadcrumbItems={breadcrumbItems} onOpenMobileMenu={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
