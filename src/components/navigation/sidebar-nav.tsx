import { NavLink } from 'react-router-dom'
import { NAVIGATION } from '@/constants/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarNavProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { role } = useAuth()

  const visibleGroups = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0)

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
      {visibleGroups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} className="flex flex-col gap-1">
          {group.label && !collapsed && (
            <span className="px-2.5 pb-1 text-overline text-primary-foreground/60">{group.label}</span>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const link = (
                <NavLink
                  to={item.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm font-medium text-primary-foreground/75 transition-colors',
                      'hover:bg-primary-foreground/10 hover:text-primary-foreground',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      collapsed && 'justify-center px-0',
                      isActive && 'bg-black/15 text-primary-foreground hover:bg-black/15 hover:text-primary-foreground',
                    )
                  }
                >
                  <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
