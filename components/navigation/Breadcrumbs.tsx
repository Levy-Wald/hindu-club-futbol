'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Inicio',
  personas: 'Personas',
  entidades: 'Entidades',
  equipos: 'Equipos',
  operaciones: 'Operaciones',
  finanzas: 'Finanzas',
  comunicaciones: 'Comunicaciones',
  configuracion: 'Configuración',
  competencias: 'Competencias',
  torneos: 'Torneos',
  inscripciones: 'Inscripciones',
  stats: 'Estadísticas',
  jugadores: 'Jugadores',
  productos: 'Productos',
  categorias: 'Categorías',
  marcas: 'Marcas',
  movimientos: 'Movimientos',
  cajas: 'Cajas',
  cuotas: 'Cuotas',
  suscripciones: 'Suscripciones',
  reportes: 'Reportes',
  conciliacion: 'Conciliación',
  periodos: 'Periodos',
  cotizaciones: 'Cotizaciones',
  convenios: 'Convenios',
  plantillas: 'Plantillas',
  envios: 'Envíos',
  sedes: 'Sedes',
  espacios: 'Espacios',
  reservas: 'Reservas',
  acceso: 'Acceso',
  concesiones: 'Concesiones',
  utileria: 'Utilería',
  salud: 'Salud',
  scouting: 'Scouting',
  padrones: 'Padrones',
  membresias: 'Membresías',
  rrhh: 'RRHH',
  proyectos: 'Proyectos',
  marketplace: 'Marketplace',
  notificaciones: 'Notificaciones',
  integraciones: 'Integraciones',
  usuarios: 'Usuarios',
  mapa: 'Mapa',
  club: 'Club',
  'mi-perfil': 'Mi perfil',
  'mi-equipo': 'Mi equipo',
  'mi-cuenta': 'Mi cuenta',
  'centros-costo': 'Centros de costo',
  'plan-cuentas': 'Plan de cuentas',
  'cuenta-corriente': 'Cuenta corriente',
  'listas-precios': 'Listas de precios',
  'reportes-deportivos': 'Reportes deportivos',
  'pre-inscripciones': 'Pre-inscripciones',
  'nominas-externas': 'Nóminas externas',
  'atributos-custom': 'Atributos custom',
  'productos-sin-cuentas': 'Productos sin cuentas',
  'cuerpo-tecnico': 'Cuerpo técnico',
  'libro-mayor': 'Libro mayor',
  balance: 'Balance',
  'estado-resultados': 'Estado de resultados',
  cobranzas: 'Cobranzas',
  config: 'Configuración',
  dashboard: 'Dashboard',
  planificadores: 'Planificadores',
  semanal: 'Semanal',
  mensual: 'Mensual',
  importar: 'Importar',
  editar: 'Editar',
  nuevo: 'Nuevo',
  nueva: 'Nueva',
  branding: 'Branding',
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 overflow-x-auto"
    >
      {segments.map((segment, i) => {
        const href = `/${segments.slice(0, i + 1).join('/')}`
        const isLast = i === segments.length - 1
        const label = isUuid(segment)
          ? 'Detalle'
          : SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ')

        return (
          <Fragment key={href}>
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
            {isLast ? (
              <span className="text-foreground font-medium truncate">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground whitespace-nowrap">
                {label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
