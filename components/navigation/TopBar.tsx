'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Briefcase,
  BarChart3,
  Settings,
  Search,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigation } from './navigation-provider'
import type { SpaceId } from '@/lib/navigation/types'

const SPACE_ICONS: Record<SpaceId, LucideIcon> = {
  'mi-dia': Home,
  operacion: Briefcase,
  gestion: BarChart3,
  setup: Settings,
}

interface TopBarProps {
  userEmail?: string
  personaId?: string
  personaNombre?: string
  onOpenPalette: () => void
}

export function TopBar({ userEmail, personaId, personaNombre, onOpenPalette }: TopBarProps) {
  const router = useRouter()
  const { visibleSpaces, activeSpace, setActiveSpace } = useNavigation()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = personaNombre
    ? personaNombre
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : userEmail
      ? userEmail.substring(0, 2).toUpperCase()
      : 'U'

  return (
    <header className="flex h-14 items-center border-b px-4 bg-background shrink-0 gap-2">
      <Link href="/admin" className="font-bold text-lg mr-4 shrink-0 hidden md:block">
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
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="user-avatar">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {personaNombre && (
                  <p className="text-sm font-medium leading-none">{personaNombre}</p>
                )}
                <p className="text-xs text-muted-foreground">{userEmail || 'Usuario'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {personaId && (
              <DropdownMenuItem onClick={() => router.push(`/admin/personas/${personaId}`)}>
                <User className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
