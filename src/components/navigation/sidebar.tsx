import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/icon-button'
import { Brand } from './brand'
import { SidebarNav } from './sidebar-nav'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  className?: string
}

/**
 * Sidebar fixa para desktop/tablet. No mobile, o mesmo conteúdo (Brand +
 * SidebarNav) é reaproveitado dentro de um Drawer — ver AppShell.
 */
export function Sidebar({ collapsed, onToggleCollapsed, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-primary-foreground/15 bg-primary transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px]' : 'w-64',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-primary-foreground/15 px-3',
          collapsed && 'justify-center px-2',
        )}
      >
        <Brand collapsed={collapsed} onPrimary />
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className={cn('border-t border-primary-foreground/15 p-2', collapsed && 'flex justify-center')}>
        <IconButton
          label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          variant="ghost"
          onClick={onToggleCollapsed}
          className={cn('text-primary-foreground hover:bg-primary-foreground/10', collapsed ? '' : 'ml-auto flex')}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-[18px]" aria-hidden="true" />
          )}
        </IconButton>
      </div>
    </aside>
  )
}
