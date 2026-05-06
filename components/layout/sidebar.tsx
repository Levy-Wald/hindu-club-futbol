'use client'

import { useState } from 'react'
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
  Calendar,
  Search,
  Briefcase,
  FileText,
  DollarSign,
} from 'lucide-react'

interface NavItemDef {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const personalItems: NavItemDef[] = [
  { label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: CreditCard },
]

const operacionesSubItems: NavItemDef[] = [
  { label: 'Esta semana', href: '/admin/operaciones', icon: Calendar },
  { label: 'Scouting', href: '/admin/operaciones/scouting', icon: Search },
]

const rrhhSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/rrhh', icon: BarChart3 },
  { label: 'Contratos', href: '/admin/rrhh/contratos', icon: FileText },
  { label: 'Liquidaciones', href: '/admin/rrhh/liquidaciones', icon: DollarSign },
]

const finanzasSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/finanzas', icon: BarChart3 },
  { label: 'Cajas', href: '/admin/finanzas/cajas', icon: Banknote },
  { label: 'Movimientos', href: '/admin/finanzas/movimientos', icon: ArrowLeftRight },
  { label: 'Productos', href: '/admin/finanzas/productos', icon: Package },
  { label: 'Cuotas', href: '/admin/finanzas/cuotas', icon: Receipt },
  { label: 'Plan de Cuentas', href: '/admin/finanzas/plan-cuentas', icon: BookOpen },
]

const adminItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Padrones', href: '/admin/padrones', icon: ClipboardList },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Entidades', href: '/admin/externos', icon: Building2 },
  // Operaciones and Finanzas are handled as collapsible sections
  { label: 'Comunicaciones', href: '/admin/comunicaciones', icon: MessageSquare },
  { label: 'Pre-inscripciones', href: '/admin/pre-inscripciones', icon: UserPlus },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

function NavItem({ item, pathname }: { item: NavItemDef; pathname: string }) {
  const isActive = item.href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(item.href)
  return (
    <Link
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
}

function SubNavItem({ item, pathname }: { item: NavItemDef; pathname: string }) {
  const isActive = item.href === '/admin/finanzas'
    ? pathname === '/admin/finanzas'
    : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors ml-4',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-3.5 w-3.5" />
      <span className="text-[13px]">{item.label}</span>
    </Link>
  )
}

function CollapsibleSection({
  label,
  icon: Icon,
  isActive,
  isOpen,
  onToggle,
  subItems,
  pathname,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  isOpen: boolean
  onToggle: () => void
  subItems: NavItemDef[]
  pathname: string
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-left',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-0.5">
          {subItems.map((item) => (
            <SubNavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      )}
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const isOperacionesActive = pathname.startsWith('/admin/operaciones')
  const isFinanzasActive = pathname.startsWith('/admin/finanzas')
  const isRRHHActive = pathname.startsWith('/admin/rrhh')
  const [operacionesOpen, setOperacionesOpen] = useState(isOperacionesActive)
  const [finanzasOpen, setFinanzasOpen] = useState(isFinanzasActive)
  const [rrhhOpen, setRRHHOpen] = useState(isRRHHActive)

  // Split adminItems: Dashboard through Entidades (0-4), then Comunicaciones onward (5+)
  const beforeCollapsible = adminItems.slice(0, 5) // Dashboard through Entidades
  const afterCollapsible = adminItems.slice(5)       // Comunicaciones onward

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          Hindu Club
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {personalItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="my-2 border-t" />
        {beforeCollapsible.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}

        <CollapsibleSection
          label="Operaciones"
          icon={CalendarDays}
          isActive={isOperacionesActive}
          isOpen={operacionesOpen}
          onToggle={() => setOperacionesOpen(!operacionesOpen)}
          subItems={operacionesSubItems}
          pathname={pathname}
        />

        <CollapsibleSection
          label="Finanzas"
          icon={Wallet}
          isActive={isFinanzasActive}
          isOpen={finanzasOpen}
          onToggle={() => setFinanzasOpen(!finanzasOpen)}
          subItems={finanzasSubItems}
          pathname={pathname}
        />

        <CollapsibleSection
          label="RRHH"
          icon={Briefcase}
          isActive={isRRHHActive}
          isOpen={rrhhOpen}
          onToggle={() => setRRHHOpen(!rrhhOpen)}
          subItems={rrhhSubItems}
          pathname={pathname}
        />

        {afterCollapsible.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  )
}
