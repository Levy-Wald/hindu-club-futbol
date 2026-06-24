'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Wallet, Calendar, User, LogOut, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PortalShellProps {
  tenantId: string
  clubNombre: string
  logoUrl: string | null
  colorPrimario: string | null
  saludo: string
  unreadCount: number
  children: React.ReactNode
}

export function PortalShell({ tenantId, clubNombre, logoUrl, colorPrimario, saludo, unreadCount, children }: PortalShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/portal/${tenantId}`

  const nav = [
    { href: base, label: 'Inicio', icon: Home },
    { href: `${base}/cuenta`, label: 'Mi cuenta', icon: Wallet },
    { href: `${base}/agenda`, label: 'Agenda', icon: Calendar },
    { href: `${base}/perfil`, label: 'Perfil', icon: User },
  ]

  function isActive(href: string) {
    if (href === base) return pathname === base
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  // Color del tenant aplicado directo al token --primary que usan los
  // componentes del portal (bg-primary / text-primary). Sin indirección.
  const themeStyle = colorPrimario
    ? ({ '--primary': colorPrimario, '--ring': colorPrimario } as React.CSSProperties)
    : undefined

  return (
    <div className="min-h-dvh flex flex-col bg-muted/20" style={themeStyle}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-lg flex items-center justify-between gap-3 px-4 h-14">
          <Link href={base} className="flex items-center gap-2.5 min-w-0 group" aria-label="Ir al inicio">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={clubNombre} className="h-9 w-9 rounded-md object-contain shrink-0" />
            ) : (
              <span className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {clubNombre.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-none truncate group-hover:text-foreground transition-colors">{clubNombre}</p>
              <p className="text-sm font-semibold truncate">{saludo}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`${base}/notificaciones`} className="relative text-muted-foreground hover:text-foreground" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-4 pb-24">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-lg grid grid-cols-4 h-16">
          {nav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
