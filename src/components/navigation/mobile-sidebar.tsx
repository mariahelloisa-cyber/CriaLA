import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Brand } from './brand'
import { SidebarNav } from './sidebar-nav'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        side="left"
        className="max-w-72 bg-primary text-primary-foreground"
        aria-label="Menu de navegação"
      >
        <div className="flex h-14 items-center border-b border-primary-foreground/15 px-3">
          <Brand onPrimary />
        </div>
        <SidebarNav onNavigate={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  )
}
