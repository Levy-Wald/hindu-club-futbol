'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, ClipboardList, Menu, X } from 'lucide-react'
import { useState } from 'react'
import {
  LayoutDashboard as DashIcon,
  Users as UsersIcon,
  ClipboardList as PadronesIcon,
  Shield,
  Building2,
  CalendarDays,
  Wallet,
  MessageSquare,
  Settings,
  UserCircle,
  Trophy,
  UserPlus,
} from 'lucide-react'

const bottomNavItems = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Más', href: '#menu', icon: Menu },
]

const fullMenuItems = [
  { label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Dashboard', href: '/admin', icon: DashIcon },
  { label: 'Personas', href: '/admin/personas', icon: UsersIcon },
  { label: 'Padrones', href: '/admin/padrones', icon: PadronesIcon },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Entidades', href: '/admin/externos', icon: Building2 },
  { label: 'Operaciones', href: '/admin/operaciones', icon: CalendarDays },
  { label: 'Cajas', href: '/admin/cajas', icon: Wallet },
  { label: 'Comunicaciones', href: '/admin/comunicaciones', icon: MessageSquare },
  { label: 'Pre-inscripciones', href: '/admin/pre-inscripciones', icon: UserPlus },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {bottomNavItems.map((item) => {
            if (item.href === '#menu') {
              return (
                <button
                  key="menu"
                  onClick={() => setMenuOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 w-16 py-1 text-muted-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            }
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-md transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background animate-in fade-in duration-150">
          <div className="flex items-center justify-between h-14 px-4 border-b">
            <span className="font-bold text-lg">Hindu Club</span>
            <button onClick={() => setMenuOpen(false)} className="p-2 rounded-md hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {fullMenuItems.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
