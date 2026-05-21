'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { SidebarItem, Space, SpaceId } from '@/lib/navigation/types'
import { getVisibleSidebarItems, groupSidebarItems, type SidebarGroup } from '@/lib/navigation/filter'

interface NavigationContextValue {
  activeSpace: SpaceId
  setActiveSpace: (space: SpaceId) => void
  visibleSpaces: Space[]
  sidebarGroups: SidebarGroup[]
  allItems: SidebarItem[]
  userCapabilities: string[]
  userAttributes: string[]
  tenantModulos: string[]
  tenantVerticales: string[]
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}

function getInitialSpace(visibleSpaces: Space[]): SpaceId {
  if (typeof document !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(c => c.startsWith('nav.activeSpace='))
    if (cookie) {
      const val = cookie.split('=')[1] as SpaceId
      if (visibleSpaces.some(s => s.id === val)) return val
    }
  }
  return visibleSpaces[0]?.id ?? 'inicio'
}

export function NavigationProvider({
  children,
  visibleSpaces,
  userCapabilities,
  userAttributes,
  tenantModulos,
  tenantVerticales,
  allItems,
}: {
  children: ReactNode
  visibleSpaces: Space[]
  userCapabilities: string[]
  userAttributes: string[]
  tenantModulos: string[]
  tenantVerticales: string[]
  allItems: SidebarItem[]
}) {
  const [activeSpace, setActiveSpaceRaw] = useState<SpaceId>(() =>
    getInitialSpace(visibleSpaces)
  )

  const setActiveSpace = useCallback(
    (space: SpaceId) => {
      setActiveSpaceRaw(space)
      document.cookie = `nav.activeSpace=${space};path=/;max-age=31536000;SameSite=Lax`
    },
    []
  )

  const filteredItems = getVisibleSidebarItems(
    userCapabilities,
    tenantModulos,
    tenantVerticales,
    activeSpace,
    userAttributes,
    allItems
  )

  const sidebarGroups = groupSidebarItems(filteredItems)

  return (
    <NavigationContext.Provider
      value={{
        activeSpace,
        setActiveSpace,
        visibleSpaces,
        sidebarGroups,
        allItems,
        userCapabilities,
        userAttributes,
        tenantModulos,
        tenantVerticales,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}
