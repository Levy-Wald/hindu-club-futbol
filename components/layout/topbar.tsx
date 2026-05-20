'use client'

import { Component, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './theme-toggle'
import { GlobalSearch } from './global-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, LogOut, User, Shield, Settings } from 'lucide-react'
import { NotificacionesDropdown } from './notificaciones-dropdown'
import { useTenant } from '@/lib/contexts/tenant-context'

class NotificacionesErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          disabled
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium opacity-50 cursor-not-allowed"
          aria-label="Notificaciones no disponibles"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificaciones</span>
        </button>
      )
    }
    return this.props.children
  }
}

interface TopbarProps {
  userEmail?: string
  personaId?: string
}

export function Topbar({ userEmail, personaId }: TopbarProps) {
  const router = useRouter()
  const { tenantId } = useTenant()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : 'U'

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 bg-background shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm md:hidden">Hindu Club</span>
        <span className="text-sm text-muted-foreground hidden md:block">ClubCore</span>
      </div>
      <div className="flex-1 flex justify-center px-4 max-w-md mx-auto">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {personaId && (
          <NotificacionesErrorBoundary>
            <NotificacionesDropdown personaId={personaId} />
          </NotificacionesErrorBoundary>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {userEmail || 'Usuario'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/admin/${tenantId}/mi-perfil`)}>
              <User className="mr-2 h-4 w-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/${tenantId}/mi-equipo`)}>
              <Shield className="mr-2 h-4 w-4" />
              Mi equipo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/admin/${tenantId}/configuracion`)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
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
