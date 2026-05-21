'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import {
  User,
  Wallet,
  Trophy,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTenant } from '@/lib/contexts/tenant-context'
import { useCapabilities } from '@/lib/permissions/capabilities-context'

interface UserAvatarMenuProps {
  userEmail?: string
  personaNombre?: string
  fotoPerfilUrl?: string
}

export function UserAvatarMenu({ userEmail, personaNombre, fotoPerfilUrl }: UserAvatarMenuProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { tenantId } = useTenant()
  const capabilities = useCapabilities()
  const isSistemaAdmin = capabilities.includes('sistema.admin')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = personaNombre
    ? personaNombre
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : userEmail
      ? userEmail.substring(0, 2).toUpperCase()
      : 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="user-avatar"
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-9 w-9 cursor-pointer">
            {fotoPerfilUrl && <AvatarImage src={fotoPerfilUrl} alt={personaNombre ?? 'Avatar'} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              {fotoPerfilUrl && <AvatarImage src={fotoPerfilUrl} alt={personaNombre ?? 'Avatar'} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 min-w-0">
              {personaNombre && (
                <p className="text-sm font-medium leading-none truncate">{personaNombre}</p>
              )}
              <p className="text-xs text-muted-foreground truncate">{userEmail || 'Usuario'}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/admin/${tenantId}/mi-perfil`)}>
          <User className="mr-2 h-4 w-4" />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/${tenantId}/mi-cuenta`)}>
          <Wallet className="mr-2 h-4 w-4" />
          Mi cuenta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/${tenantId}/mi-equipo`)}>
          <Trophy className="mr-2 h-4 w-4" />
          Mi equipo
        </DropdownMenuItem>
        {isSistemaAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/scl')}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Panel SCL
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground mb-1.5">Tema</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${theme === 'light' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Sun className="h-3 w-3" />
              Claro
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${theme === 'dark' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Moon className="h-3 w-3" />
              Oscuro
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${theme === 'system' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Monitor className="h-3 w-3" />
              Auto
            </button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
