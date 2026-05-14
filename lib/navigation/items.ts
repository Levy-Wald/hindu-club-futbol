import {
  LayoutDashboard,
  Users,
  Building2,
  Wallet,
  MessageSquare,
  Settings,
  UserCircle,
  Trophy,
  CreditCard,
  Bell,
  Banknote,
  ArrowLeftRight,
  Receipt,
  BookOpen,
  BarChart3,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  Send,
  FileEdit,
  Shield,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  KeyRound,
  FileSpreadsheet,
  CalendarCheck,
  Store,
  Shirt,
  HeartPulse,
  ShoppingBag,
  MapPin,
  ShoppingCart,
  Tag,
} from 'lucide-react'

export interface NavItemDef {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  locked?: boolean
}

export interface NavSectionDef {
  key: string
  label: string
  testId: string
  items: NavItemDef[]
  collapsibles: NavCollapsibleDef[]
}

export interface NavCollapsibleDef {
  label: string
  icon: React.ComponentType<{ className?: string }>
  subItems: NavItemDef[]
  activeCheck: (pathname: string) => boolean
}

// --- Personal (top bar) ---
export const personalItems: NavItemDef[] = [
  { label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: CreditCard },
  { label: 'Notificaciones', href: '/admin/notificaciones', icon: Bell },
]

export const dashboardItem: NavItemDef = {
  label: 'Inicio',
  href: '/admin',
  icon: LayoutDashboard,
}

// --- TRONCAL ---
export const troncalSection: NavSectionDef = {
  key: 'troncal',
  label: 'Troncal',
  testId: 'sidebar-section-troncal',
  items: [
    { label: 'Personas', href: '/admin/personas', icon: Users },
    { label: 'Entidades', href: '/admin/entidades', icon: Building2 },
  ],
  collapsibles: [
    {
      label: 'Productos',
      icon: ShoppingCart,
      activeCheck: (p) => p.startsWith('/admin/productos'),
      subItems: [
        { label: 'Productos', href: '/admin/productos', icon: ShoppingCart },
        { label: 'Categorias', href: '/admin/productos/categorias', icon: Tag },
        { label: 'Marcas', href: '/admin/productos/marcas', icon: Tag },
        { label: 'Listas de Precios', href: '/admin/productos/listas-precios', icon: DollarSign },
      ],
    },
    {
      label: 'Operaciones',
      icon: Calendar,
      activeCheck: (p) => p.startsWith('/admin/operaciones') || p.startsWith('/admin/planificadores'),
      subItems: [
        { label: 'Calendario', href: '/admin/operaciones', icon: Calendar },
        { label: 'Planificador', href: '/admin/planificadores/semanal', icon: CalendarDays },
      ],
    },
    {
      label: 'Configuracion',
      icon: Settings,
      activeCheck: (p) => p.startsWith('/admin/configuracion') || p.startsWith('/admin/marketplace'),
      subItems: [
        { label: 'Sedes', href: '/admin/configuracion/sedes', icon: MapPin },
        { label: 'Espacios', href: '/admin/configuracion/espacios', icon: LayoutDashboard },
        { label: 'Marketplace', href: '/admin/marketplace', icon: ShoppingBag },
        { label: 'General', href: '/admin/configuracion', icon: Settings },
      ],
    },
    {
      label: 'Finanzas',
      icon: Wallet,
      activeCheck: (p) => p.startsWith('/admin/finanzas'),
      subItems: [
        { label: 'Dashboard', href: '/admin/finanzas', icon: BarChart3 },
        { label: 'Cajas', href: '/admin/finanzas/cajas', icon: Banknote },
        { label: 'Movimientos', href: '/admin/finanzas/movimientos', icon: ArrowLeftRight },
        { label: 'Cuotas', href: '/admin/finanzas/cuotas', icon: Receipt },
        { label: 'Plan de Cuentas', href: '/admin/finanzas/plan-cuentas', icon: BookOpen },
      ],
    },
    {
      label: 'Comunicaciones',
      icon: MessageSquare,
      activeCheck: (p) => p.startsWith('/admin/comunicaciones'),
      subItems: [
        { label: 'Dashboard', href: '/admin/comunicaciones', icon: BarChart3 },
        { label: 'Plantillas', href: '/admin/comunicaciones/plantillas', icon: FileEdit },
        { label: 'Envios', href: '/admin/comunicaciones/envios', icon: Send },
      ],
    },
  ],
}

// --- CROSS-VERTICAL ---
export const crossVerticalSection: NavSectionDef = {
  key: 'cross-vertical',
  label: 'Cross-vertical',
  testId: 'sidebar-section-cross-vertical',
  items: [
    { label: 'Reservas', href: '/admin/reservas', icon: CalendarCheck },
    { label: 'POS', href: '/admin/concesiones', icon: Store },
    { label: 'Inventario', href: '/admin/utileria', icon: Shirt },
    { label: 'Acceso', href: '/admin/acceso', icon: KeyRound },
    { label: 'Pre-inscripciones', href: '/admin/pre-inscripciones', icon: ClipboardList },
    { label: 'Nominas externas', href: '/admin/nominas-externas', icon: FileSpreadsheet },
  ],
  collapsibles: [
    {
      label: 'RRHH',
      icon: Briefcase,
      activeCheck: (p) => p.startsWith('/admin/rrhh'),
      subItems: [
        { label: 'Dashboard', href: '/admin/rrhh', icon: BarChart3 },
        { label: 'Contratos', href: '/admin/rrhh/contratos', icon: FileText },
        { label: 'Liquidaciones', href: '/admin/rrhh/liquidaciones', icon: DollarSign },
      ],
    },
  ],
}

// --- CCBP (Club Deportivo) ---
export const ccbpSection: NavSectionDef = {
  key: 'ccbp',
  label: 'Club Deportivo',
  testId: 'sidebar-section-ccbp',
  items: [
    { label: 'Equipos', href: '/admin/equipos', icon: Shield },
    { label: 'Cuerpo Tecnico', href: '/admin/equipos/cuerpo-tecnico', icon: Briefcase },
    { label: 'Padrones', href: '/admin/padrones', icon: ClipboardList },
    { label: 'Salud', href: '/admin/salud', icon: HeartPulse },
  ],
  collapsibles: [
    {
      label: 'Competencias',
      icon: Trophy,
      activeCheck: (p) => p.startsWith('/admin/competencias'),
      subItems: [
        { label: 'Torneos', href: '/admin/competencias/torneos', icon: Trophy },
        { label: 'Inscripciones', href: '/admin/competencias/inscripciones', icon: ClipboardCheck },
        { label: 'Estadisticas', href: '/admin/competencias/stats/jugadores', icon: BarChart3 },
      ],
    },
  ],
}

// All sections in order
export const navSections: NavSectionDef[] = [
  troncalSection,
  crossVerticalSection,
  ccbpSection,
]
