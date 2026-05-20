'use client'

import Link from 'next/link'
import {
  Home,
  Briefcase,
  BarChart3,
  Settings,
  Layers,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigation } from './navigation-provider'
import { UserAvatarMenu } from './UserAvatarMenu'
import { useTenant } from '@/lib/contexts/tenant-context'
import type { SpaceId } from '@/lib/navigation/types'

const SPACE_ICONS: Record<SpaceId, LucideIcon> = {
  'mi-dia': Home,
  operacion: Briefcase,
  gestion: BarChart3,
  setup: Settings,
  plataforma: Layers,
}

interface TopBarProps {
  userEmail?: string
  personaNombre?: string
  fotoPerfilUrl?: string
  onOpenPalette: () => void
}

export function TopBar({ userEmail, personaNombre, fotoPerfilUrl, onOpenPalette }: TopBarProps) {
  const { visibleSpaces, activeSpace, setActiveSpace } = useNavigation()
  const { tenantId } = useTenant()

  return (
    <header className="flex h-14 items-center border-b px-4 bg-background shrink-0 gap-2">
      <Link href={`/admin/${tenantId}`} className="font-bold text-lg mr-4 shrink-0 hidden md:block">
        Hindu Club
      </Link>
      <span className="font-bold text-sm md:hidden shrink-0">Hindu</span>

      <nav className="flex items-center gap-1 overflow-x-auto">
        {visibleSpaces.map(space => {
          const Icon = SPACE_ICONS[space.id]
          return (
            <button
              key={space.id}
              onClick={() => setActiveSpace(space.id)}
              data-testid={`space-${space.id}`}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap',
                activeSpace === space.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{space.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          data-testid="cmd-k-trigger"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-1.5 border rounded-md"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Buscar...</span>
          <kbd className="hidden md:inline text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
        <UserAvatarMenu
          userEmail={userEmail}
          personaNombre={personaNombre}
          fotoPerfilUrl={fotoPerfilUrl}
        />
      </div>
    </header>
  )
}
