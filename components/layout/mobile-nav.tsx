'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Menu,
  X,
  Shield,
  Building2,
  CalendarDays,
  Wallet,
  MessageSquare,
  Settings,
  UserCircle,
  Trophy,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Banknote,
  ArrowLeftRight,
  Package,
  Receipt,
  BookOpen,
  CreditCard,
  BarChart3,
} from 'lucide-react'

const bottomNavItems = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Mas', href: '#menu', icon: Menu },
]

interface NavItemDef {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const finanzasSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/finanzas', icon: BarChart3 },
  { label: 'Cajas', href: '/admin/finanzas/cajas', icon: Banknote },
  { label: 'Movimientos', href: '/admin/finanzas/movimientos', icon: ArrowLeftRight },
  { label: 'Productos', href: '/admin/finanzas/productos', icon: Package },
  { label: 'Cuotas', href: '/admin/finanzas/cuotas', icon: Receipt },
  { label: 'Plan de Cuentas', href: '/admin/finanzas/plan-cuentas', icon: BookOpen },
]

const fullMenuItems: NavItemDef[] = [
  { label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: CreditCard },
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Padrones', href: '/admin/padrones', icon: ClipboardList },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Entidades', href: '/admin/externos', icon: Building2 },
  { label: 'Operaciones', href: '/admin/operaciones', icon: CalendarDays },
  // Finanzas is handled as collapsible section inline
  { label: 'Comunicaciones', href: '/admin/comunicaciones', icon: MessageSquare },
  { label: 'Pre-inscripciones', href: '/admin/pre-inscripciones', icon: UserPlus },
  { label: 'Configuracion', href: '/admin/configuracion', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [finanzasOpen, setFinanzasOpen] = useState(
    pathname.startsWith('/admin/finanzas')
  )

  // Split menu items around Finanzas (insert after Operaciones = index 8)
  const beforeFinanzas = fullMenuItems.slice(0, 9) // Mi perfil through Operaciones
  const afterFinanzas = fullMenuItems.slice(9)       // Comunicaciones onward

  const isFinanzasActive = pathname.startsWith('/admin/finanzas')

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
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            {beforeFinanzas.map((item) => {
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

            {/* Finanzas collapsible section */}
            <button
              onClick={() => setFinanzasOpen(!finanzasOpen)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors w-full text-left',
                isFinanzasActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Wallet className="h-5 w-5" />
              <span className="flex-1">Finanzas</span>
              {finanzasOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            {finanzasOpen && (
              <div className="space-y-0.5 ml-4">
                {finanzasSubItems.map((sub) => {
                  const isSubActive = sub.href === '/admin/finanzas'
                    ? pathname === '/admin/finanzas'
                    : pathname.startsWith(sub.href)
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                        isSubActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <sub.icon className="h-4 w-4" />
                      {sub.label}
                    </Link>
                  )
                })}
              </div>
            )}

            {afterFinanzas.map((item) => {
              const isActive = pathname.startsWith(item.href)
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
