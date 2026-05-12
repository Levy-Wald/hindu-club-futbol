'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Bell,
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
  Send,
  FileEdit,
  Plug,
  FolderTree,
  HeartPulse,
  Shirt,
  Store,
  KeyRound,
  FileSpreadsheet,
  CalendarRange,
} from 'lucide-react'

interface NavItemDef {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// --- Section definitions ---

const personalItems: NavItemDef[] = [
  { label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: CreditCard },
  { label: 'Notificaciones', href: '/admin/notificaciones', icon: Bell },
]

const dashboardItem: NavItemDef = { label: 'Dashboard', href: '/admin', icon: LayoutDashboard }

const crmItems: NavItemDef[] = [
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Entidades', href: '/admin/externos', icon: Building2 },
  { label: 'Pre-inscripciones', href: '/admin/pre-inscripciones', icon: UserPlus },
]

const comunicacionesSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/comunicaciones', icon: BarChart3 },
  { label: 'Plantillas', href: '/admin/comunicaciones/plantillas', icon: FileEdit },
  { label: 'Envíos', href: '/admin/comunicaciones/envios', icon: Send },
]

const finanzasSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/finanzas', icon: BarChart3 },
  { label: 'Cajas', href: '/admin/finanzas/cajas', icon: Banknote },
  { label: 'Movimientos', href: '/admin/finanzas/movimientos', icon: ArrowLeftRight },
  { label: 'Productos', href: '/admin/finanzas/productos', icon: Package },
  { label: 'Cuotas', href: '/admin/finanzas/cuotas', icon: Receipt },
  { label: 'Suscripciones', href: '/admin/finanzas/suscripciones', icon: CreditCard },
  { label: 'Centros de Costo', href: '/admin/finanzas/centros-costo', icon: FolderTree },
  { label: 'Plan de Cuentas', href: '/admin/finanzas/plan-cuentas', icon: BookOpen },
]

const rrhhSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/rrhh', icon: BarChart3 },
  { label: 'Contratos', href: '/admin/rrhh/contratos', icon: FileText },
  { label: 'Liquidaciones', href: '/admin/rrhh/liquidaciones', icon: DollarSign },
]

const concesionesSubItems: NavItemDef[] = [
  { label: 'Concesionarios', href: '/admin/concesiones', icon: Store },
  { label: 'Reportes', href: '/admin/concesiones/reportes', icon: BarChart3 },
]

const clubItems: NavItemDef[] = [
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Cuerpo Técnico', href: '/admin/equipos/cuerpo-tecnico', icon: Briefcase },
  { label: 'Padrones', href: '/admin/padrones', icon: ClipboardList },
  { label: 'Salud', href: '/admin/salud', icon: HeartPulse },
]

const utileriaSubItems: NavItemDef[] = [
  { label: 'Dashboard', href: '/admin/utileria', icon: BarChart3 },
  { label: 'Inventario', href: '/admin/utileria/inventario', icon: Package },
  { label: 'Kits', href: '/admin/utileria/kits', icon: ClipboardList },
  { label: 'Solicitudes', href: '/admin/utileria/solicitudes', icon: Send },
  { label: 'Cargos', href: '/admin/utileria/cargos', icon: DollarSign },
]

const operacionesSubItems: NavItemDef[] = [
  { label: 'Esta semana', href: '/admin/operaciones', icon: Calendar },
  { label: 'Acceso', href: '/admin/acceso', icon: KeyRound },
  { label: 'Nóminas externas', href: '/admin/nominas-externas', icon: FileSpreadsheet },
  { label: 'Scouting', href: '/admin/operaciones/scouting', icon: Search },
]

const planificadoresSubItems: NavItemDef[] = [
  { label: 'Mensual', href: '/admin/planificadores/mensual', icon: CalendarRange },
  { label: 'Semanal', href: '/admin/planificadores/semanal', icon: CalendarDays },
]

const plataformaItems: NavItemDef[] = [
  { label: 'Integraciones', href: '/admin/integraciones', icon: Plug },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

// --- Components ---

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
  const segments = item.href.split('/').filter(Boolean)
  const isParentDashboard = segments.length === 2
  const isActive = isParentDashboard
    ? pathname === item.href
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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
    </div>
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
  const isOperacionesActive = pathname.startsWith('/admin/operaciones') || pathname.startsWith('/admin/acceso') || pathname.startsWith('/admin/nominas-externas')
  const isFinanzasActive = pathname.startsWith('/admin/finanzas')
  const isRRHHActive = pathname.startsWith('/admin/rrhh')
  const isComunicacionesActive = pathname.startsWith('/admin/comunicaciones')
  const isUtileriaActive = pathname.startsWith('/admin/utileria')
  const isConcesionesActive = pathname.startsWith('/admin/concesiones')
  const isPlanificadoresActive = pathname.startsWith('/admin/planificadores')
  const [operacionesOpen, setOperacionesOpen] = useState(isOperacionesActive)
  const [finanzasOpen, setFinanzasOpen] = useState(isFinanzasActive)
  const [rrhhOpen, setRRHHOpen] = useState(isRRHHActive)
  const [comunicacionesOpen, setComunicacionesOpen] = useState(isComunicacionesActive)
  const [utileriaOpen, setUtileriaOpen] = useState(isUtileriaActive)
  const [concesionesOpen, setConcesionesOpen] = useState(isConcesionesActive)
  const [planificadoresOpen, setPlanificadoresOpen] = useState(isPlanificadoresActive)

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          Hindu Club
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {/* Personal */}
        {personalItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="my-2 border-t" />

        {/* Vista general */}
        <NavItem item={dashboardItem} pathname={pathname} />

        {/* CRM */}
        <SectionHeader label="CRM" />
        {crmItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
        <CollapsibleSection
          label="Comunicaciones"
          icon={MessageSquare}
          isActive={isComunicacionesActive}
          isOpen={comunicacionesOpen}
          onToggle={() => setComunicacionesOpen(!comunicacionesOpen)}
          subItems={comunicacionesSubItems}
          pathname={pathname}
        />

        {/* ERP */}
        <SectionHeader label="ERP" />
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

        <CollapsibleSection
          label="Concesiones"
          icon={Store}
          isActive={isConcesionesActive}
          isOpen={concesionesOpen}
          onToggle={() => setConcesionesOpen(!concesionesOpen)}
          subItems={concesionesSubItems}
          pathname={pathname}
        />

        {/* Club Deportivo */}
        <SectionHeader label="Club Deportivo" />
        {clubItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
        <CollapsibleSection
          label="Utileria"
          icon={Shirt}
          isActive={isUtileriaActive}
          isOpen={utileriaOpen}
          onToggle={() => setUtileriaOpen(!utileriaOpen)}
          subItems={utileriaSubItems}
          pathname={pathname}
        />
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
          label="Planificadores"
          icon={CalendarRange}
          isActive={isPlanificadoresActive}
          isOpen={planificadoresOpen}
          onToggle={() => setPlanificadoresOpen(!planificadoresOpen)}
          subItems={planificadoresSubItems}
          pathname={pathname}
        />

        {/* Plataforma */}
        <SectionHeader label="Plataforma" />
        {plataformaItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  )
}
