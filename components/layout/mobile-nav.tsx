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
  Calendar,
  Search,
  Briefcase,
  FileText,
  DollarSign,
  Send,
  FileEdit,
  Plug,
  KeyRound,
  FileSpreadsheet,
  CalendarRange,
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

const operacionesSubItems: NavItemDef[] = [
  { label: 'Esta semana', href: '/admin/operaciones', icon: Calendar },
  { label: 'Acceso', href: '/admin/acceso', icon: KeyRound },
  { label: 'Nóminas externas', href: '/admin/nominas-externas', icon: FileSpreadsheet },
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

const comunicacionesSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/comunicaciones', icon: BarChart3 },
  { label: 'Plantillas', href: '/admin/comunicaciones/plantillas', icon: FileEdit },
  { label: 'Envíos', href: '/admin/comunicaciones/envios', icon: Send },
]

const planificadoresSubItems: NavItemDef[] = [
  { label: 'Mensual', href: '/admin/planificadores/mensual', icon: CalendarRange },
]

function MobileSectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
    </div>
  )
}

function MobileCollapsible({
  label,
  icon: Icon,
  isActive,
  isOpen,
  onToggle,
  subItems,
  pathname,
  onClose,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  isOpen: boolean
  onToggle: () => void
  subItems: NavItemDef[]
  pathname: string
  onClose: () => void
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors w-full text-left',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{label}</span>
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 ml-4">
          {subItems.map((sub) => {
            const isSubActive = sub.href === `/admin/${label.toLowerCase()}`
              ? pathname === sub.href
              : pathname.startsWith(sub.href)
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onClose}
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
    </>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [operacionesOpen, setOperacionesOpen] = useState(pathname.startsWith('/admin/operaciones') || pathname.startsWith('/admin/acceso') || pathname.startsWith('/admin/nominas-externas'))
  const [finanzasOpen, setFinanzasOpen] = useState(pathname.startsWith('/admin/finanzas'))
  const [rrhhOpen, setRRHHOpen] = useState(pathname.startsWith('/admin/rrhh'))
  const [comunicacionesOpen, setComunicacionesOpen] = useState(pathname.startsWith('/admin/comunicaciones'))
  const [planificadoresOpen, setPlanificadoresOpen] = useState(pathname.startsWith('/admin/planificadores'))

  const closeMenu = () => setMenuOpen(false)

  function MobileNavItem({ item }: { item: NavItemDef }) {
    const isActive = item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href)
    return (
      <Link
        href={item.href}
        onClick={closeMenu}
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
  }

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
                  isActive ? 'text-primary' : 'text-muted-foreground'
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
            <button onClick={closeMenu} className="p-2 rounded-md hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            {/* Personal */}
            <MobileNavItem item={{ label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle }} />
            <MobileNavItem item={{ label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy }} />
            <MobileNavItem item={{ label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: CreditCard }} />

            <div className="my-2 border-t" />

            {/* Dashboard */}
            <MobileNavItem item={{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }} />

            {/* CRM */}
            <MobileSectionHeader label="CRM" />
            <MobileNavItem item={{ label: 'Personas', href: '/admin/personas', icon: Users }} />
            <MobileNavItem item={{ label: 'Entidades', href: '/admin/externos', icon: Building2 }} />
            <MobileNavItem item={{ label: 'Pre-inscripciones', href: '/admin/pre-inscripciones', icon: UserPlus }} />
            <MobileCollapsible
              label="Comunicaciones"
              icon={MessageSquare}
              isActive={pathname.startsWith('/admin/comunicaciones')}
              isOpen={comunicacionesOpen}
              onToggle={() => setComunicacionesOpen(!comunicacionesOpen)}
              subItems={comunicacionesSubItems}
              pathname={pathname}
              onClose={closeMenu}
            />

            {/* ERP */}
            <MobileSectionHeader label="ERP" />
            <MobileCollapsible
              label="Finanzas"
              icon={Wallet}
              isActive={pathname.startsWith('/admin/finanzas')}
              isOpen={finanzasOpen}
              onToggle={() => setFinanzasOpen(!finanzasOpen)}
              subItems={finanzasSubItems}
              pathname={pathname}
              onClose={closeMenu}
            />
            <MobileCollapsible
              label="RRHH"
              icon={Briefcase}
              isActive={pathname.startsWith('/admin/rrhh')}
              isOpen={rrhhOpen}
              onToggle={() => setRRHHOpen(!rrhhOpen)}
              subItems={rrhhSubItems}
              pathname={pathname}
              onClose={closeMenu}
            />

            {/* Club Deportivo */}
            <MobileSectionHeader label="Club Deportivo" />
            <MobileNavItem item={{ label: 'Equipos', href: '/admin/equipos', icon: Shield }} />
            <MobileNavItem item={{ label: 'Padrones', href: '/admin/padrones', icon: ClipboardList }} />
            <MobileCollapsible
              label="Operaciones"
              icon={CalendarDays}
              isActive={pathname.startsWith('/admin/operaciones') || pathname.startsWith('/admin/acceso') || pathname.startsWith('/admin/nominas-externas')}
              isOpen={operacionesOpen}
              onToggle={() => setOperacionesOpen(!operacionesOpen)}
              subItems={operacionesSubItems}
              pathname={pathname}
              onClose={closeMenu}
            />
            <MobileCollapsible
              label="Planificadores"
              icon={CalendarRange}
              isActive={pathname.startsWith('/admin/planificadores')}
              isOpen={planificadoresOpen}
              onToggle={() => setPlanificadoresOpen(!planificadoresOpen)}
              subItems={planificadoresSubItems}
              pathname={pathname}
              onClose={closeMenu}
            />

            {/* Plataforma */}
            <MobileSectionHeader label="Plataforma" />
            <MobileNavItem item={{ label: 'Integraciones', href: '/admin/integraciones', icon: Plug }} />
            <MobileNavItem item={{ label: 'Configuración', href: '/admin/configuracion', icon: Settings }} />
          </nav>
        </div>
      )}
    </>
  )
}
