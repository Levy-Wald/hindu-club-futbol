import type { Space, SpaceId, SpaceVisibilityRule } from './types'

export const SPACES: Space[] = [
  { id: 'inicio', label: 'Inicio', icon: 'Home' },
  { id: 'personas', label: 'Personas', icon: 'Users' },
  { id: 'actividad', label: 'Actividad', icon: 'Calendar' },
  { id: 'marketing', label: 'Marketing', icon: 'Megaphone' },
  { id: 'finanzas', label: 'Finanzas', icon: 'TrendingUp' },
  { id: 'recursos', label: 'Recursos', icon: 'Package' },
  { id: 'configuracion', label: 'Configuracion', icon: 'Settings' },
]

export const SPACE_VISIBILITY_RULES: Record<SpaceId, SpaceVisibilityRule> = {
  inicio: {
    visible_if: 'always',
  },
  personas: {
    visible_if_has_any: [
      'personas.read',
      'personas.write',
      'cobranza.read',
      'cobranza.write',
      'ccbp.plantel.read',
      'ccbp.salud.read_basic',
      'acceso.guardia',
      'rrhh.read',
      'rrhh.admin',
      'concesiones.operar',
    ],
  },
  actividad: {
    visible_if_has_any: [
      'asistencias.read',
      'asistencias.write',
      'reservas.read',
      'reservas.write',
      'ccbp.entrenamientos.read',
      'ccbp.scouting.read',
      'ccbp.partidos.cargar',
      'ccbp.torneos.admin',
      'eventos.read',
      'eventos.write',
      'ccbp.plantel.read',
    ],
  },
  marketing: {
    visible_if_has_any: [
      'comunicaciones.send',
      'personas.write',
    ],
  },
  finanzas: {
    visible_if_has_any: [
      'finanzas.read',
      'finanzas.reportes',
      'finanzas.conciliacion',
      'finanzas.admin',
      'caja.operar',
    ],
  },
  recursos: {
    visible_if_has_any: [
      'pim.read',
      'pim.admin',
      'inventario.read',
      'inventario.write',
      'reservas.read',
      'ccbp.utileria.admin',
      'ccbp.mapa.admin',
      'proyectos.read',
      'proyectos.admin',
      'ecommerce.read',
      'ecommerce.admin',
    ],
  },
  configuracion: {
    visible_if_has_any: [
      'setup.users',
      'setup.modulos',
      'setup.tenant',
      'setup.planes',
      'setup.catalogos',
      'setup.integraciones',
      'atributos_custom.admin',
    ],
  },
}
