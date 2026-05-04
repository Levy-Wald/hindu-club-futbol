'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Shield,
  Building2,
  CalendarDays,
  Wallet,
  MessageSquare,
  Settings,
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Padrones', href: '/admin/padrones', icon: ClipboardList },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Externos', href: '/admin/externos', icon: Building2 },
  { label: 'Operaciones', href: '/admin/operaciones', icon: CalendarDays },
  { label: 'Cajas', href: '/admin/cajas', icon: Wallet },
  { label: 'Comunicaciones', href: '/admin/comunicaciones', icon: MessageSquare },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          Hindu Club
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
