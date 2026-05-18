'use client'

import { cn } from '@/lib/utils'
import { useNavigation } from './navigation-provider'
import { SidebarGroup } from './SidebarGroup'
import type { SidebarCapa } from '@/lib/navigation/types'

const CAPA_COLORS: Record<SidebarCapa, string> = {
  troncal: 'border-l-blue-500',
  cross_vertical: 'border-l-amber-500',
  vertical_ccbp: 'border-l-emerald-500',
}

export function NavSidebar() {
  const { sidebarGroups } = useNavigation()

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar overflow-y-auto"
      data-testid="sidebar"
    >
      <nav className="p-2 space-y-1">
        {sidebarGroups.map(capaGroup => (
          <div key={capaGroup.capa} className={cn('border-l-2 pl-1 mb-2', CAPA_COLORS[capaGroup.capa])}>
            <div className="px-2 pt-3 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {capaGroup.label}
              </span>
            </div>
            {capaGroup.subGroups.map(sg => (
              <SidebarGroup key={sg.grupo} label={sg.grupo} items={sg.items} />
            ))}
          </div>
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
