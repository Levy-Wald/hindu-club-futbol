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
  const rawSegments = pathname.split('/').filter(Boolean)

  // Detect tenant UUID segment for skipping in display and preserving in hrefs
  const hasTenant = rawSegments.length >= 2 && rawSegments[0] === 'admin' && isUuid(rawSegments[1])
  const tenantPrefix = hasTenant ? `/admin/${rawSegments[1]}` : ''

  // Display segments: skip tenant UUID
  const displaySegments: string[] = []
  for (let i = 0; i < rawSegments.length; i++) {
    if (i === 1 && hasTenant) continue
    displaySegments.push(rawSegments[i])
  }

  if (displaySegments.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 overflow-x-auto"
    >
      {displaySegments.map((segment, i) => {
        // Build href: for 'admin' use tenant prefix, for rest append to tenant prefix
        let href: string
        if (i === 0 && segment === 'admin') {
          href = tenantPrefix || '/admin'
        } else {
          const displayPath = `/${displaySegments.slice(0, i + 1).join('/')}`
          href = hasTenant
            ? `${tenantPrefix}${displayPath.slice(6)}` // /admin/X → tenantPrefix/X
            : displayPath
        }

        const isLast = i === displaySegments.length - 1
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
