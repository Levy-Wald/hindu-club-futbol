'use client'

import type { ReactNode } from 'react'
import type { SidebarItem, Space } from '@/lib/navigation/types'
import { NavigationProvider } from './navigation-provider'
import { TopBar } from './TopBar'
import { NavSidebar } from './NavSidebar'
import { MobileDrawer } from './MobileDrawer'
import { CommandPalette, useCommandPaletteOpen } from './CommandPalette'
import { Breadcrumbs } from './Breadcrumbs'

interface NavigationShellProps {
  children: ReactNode
  userEmail?: string
  visibleSpaces: Space[]
  userCapabilities: string[]
  tenantModulos: string[]
  tenantVerticales: string[]
  allItems: SidebarItem[]
}

export function NavigationShell({
  children,
  userEmail,
  visibleSpaces,
  userCapabilities,
  tenantModulos,
  tenantVerticales,
  allItems,
}: NavigationShellProps) {
  const { open, setOpen, openPalette } = useCommandPaletteOpen()

  return (
    <NavigationProvider
      visibleSpaces={visibleSpaces}
      userCapabilities={userCapabilities}
      tenantModulos={tenantModulos}
      tenantVerticales={tenantVerticales}
      allItems={allItems}
    >
      <div className="flex h-dvh flex-col overflow-hidden">
        <TopBar userEmail={userEmail} onOpenPalette={openPalette} />
        <div className="flex flex-1 overflow-hidden">
          <NavSidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
            <Breadcrumbs />
            {children}
          </main>
        </div>
        <MobileDrawer />
        <CommandPalette open={open} onOpenChange={setOpen} />
      </div>
    </NavigationProvider>
  )
}
