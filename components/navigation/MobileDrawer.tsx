'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, Home, Briefcase, BarChart3, Settings, Layers, type LucideIcon } from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useNavigation } from './navigation-provider'
import { SidebarGroup } from './SidebarGroup'
import type { SpaceId, SidebarCapa } from '@/lib/navigation/types'
import { getVisibleSidebarItems, groupSidebarItems } from '@/lib/navigation/filter'

const SPACE_ICONS: Record<SpaceId, LucideIcon> = {
  'mi-dia': Home,
  operacion: Briefcase,
  gestion: BarChart3,
  setup: Settings,
  plataforma: Layers,
}

export function MobileDrawer() {
  const pathname = usePathname()
  const {
    visibleSpaces,
    activeSpace,
    setActiveSpace,
    userCapabilities,
    userAttributes,
    tenantModulos,
    tenantVerticales,
  } = useNavigation()
  const [open, setOpen] = useState(false)
  const [mobileSpace, setMobileSpace] = useState<SpaceId>(activeSpace)

  const items = getVisibleSidebarItems(
    userCapabilities,
    tenantModulos,
    tenantVerticales,
    mobileSpace,
    userAttributes
  )
  const capaGroups = groupSidebarItems(items)

  const CAPA_COLORS: Record<SidebarCapa, string> = {
    troncal: 'border-l-blue-500',
    cross_vertical: 'border-l-amber-500',
    vertical_ccbp: 'border-l-emerald-500',
    integracion: 'border-l-purple-500',
    plataforma_saas: 'border-l-indigo-500',
    ia_nativa: 'border-l-cyan-500',
  }

  function handleSpaceSelect(space: SpaceId) {
    setMobileSpace(space)
    setActiveSpace(space)
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {visibleSpaces.slice(0, 3).map(space => {
          const Icon = SPACE_ICONS[space.id]
          const isActive = activeSpace === space.id
          return (
            <Link
              key={space.id}
              href="/admin"
              onClick={() => setActiveSpace(space.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-md transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
              <span className="text-[10px] font-medium">{space.label}</span>
            </Link>
          )
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex flex-col items-center justify-center gap-0.5 w-16 py-1 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Más</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="border-b">
              <SheetTitle>Hindu Club</SheetTitle>
            </SheetHeader>
            <div className="flex gap-1 p-2 border-b overflow-x-auto">
              {visibleSpaces.map(space => {
                const Icon = SPACE_ICONS[space.id]
                return (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceSelect(space.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap',
                      mobileSpace === space.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-muted-foreground'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {space.label}
                  </button>
                )
              })}
            </div>
            <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {capaGroups.map(capaGroup => (
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
              {capaGroups.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 px-4">
                  No tenés items en este espacio.
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
