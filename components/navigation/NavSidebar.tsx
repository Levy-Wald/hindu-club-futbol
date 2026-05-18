'use client'

import { useNavigation } from './navigation-provider'
import { SidebarGroup } from './SidebarGroup'

export function NavSidebar() {
  const { sidebarGroups } = useNavigation()

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar overflow-y-auto"
      data-testid="sidebar"
    >
      <nav className="p-2 space-y-1">
        {sidebarGroups.map(group => (
          <SidebarGroup key={group.grupo} label={group.grupo} items={group.items} />
        ))}
        {sidebarGroups.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 px-4">
            No tenés items disponibles en este espacio.
          </div>
        )}
      </nav>
    </aside>
  )
}
