'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  Calendar,
  Megaphone,
  TrendingUp,
  Package,
  Settings,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useNavigation } from './navigation-provider'
import { SidebarGroup } from './SidebarGroup'
import { useTenant } from '@/lib/contexts/tenant-context'
import type { SpaceId } from '@/lib/navigation/types'
import { filterItemsByEspacio, groupSidebarItems } from '@/lib/navigation/filter'

const SPACE_ICONS: Record<SpaceId, LucideIcon> = {
  inicio: Home,
  personas: Users,
  actividad: Calendar,
  marketing: Megaphone,
  finanzas: TrendingUp,
  recursos: Package,
  configuracion: Settings,
}

export function MobileDrawer() {
  const {
    visibleSpaces,
    activeSpace,
    setActiveSpace,
    allItems,
  } = useNavigation()
  const { tenantId } = useTenant()
  const [open, setOpen] = useState(false)
  const [mobileSpace, setMobileSpace] = useState<SpaceId>(activeSpace)

  // F1.6: allItems ya viene filtrado server-side; solo recortamos por espacio.
  const items = filterItemsByEspacio(allItems, mobileSpace)
  const groups = groupSidebarItems(items)

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
              href={`/admin/${tenantId}`}
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
            <span className="text-[10px] font-medium">Mas</span>
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
              {groups.map(group => (
                <SidebarGroup key={group.grupo} label={group.grupo} items={group.items} />
              ))}
              {groups.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 px-4">
                  No tenes items en este espacio.
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
