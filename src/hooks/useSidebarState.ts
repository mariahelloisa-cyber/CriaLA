import { useEffect, useState } from 'react'

const STORAGE_KEY = 'soucriala:sidebar-collapsed'

function readStoredCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === 'true'
}

/**
 * Estado de colapso da Sidebar (desktop/tablet), persistido entre sessões.
 * O drawer mobile tem seu próprio estado (aberto/fechado), não persistido.
 */
export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => readStoredCollapsed())
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return {
    collapsed,
    toggleCollapsed: () => setCollapsed((prev) => !prev),
    mobileOpen,
    setMobileOpen,
  }
}
