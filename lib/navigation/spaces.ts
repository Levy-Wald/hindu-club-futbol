import type { Space, SpaceId, SpaceVisibilityRule } from './types'

export const SPACES: Space[] = [
  { id: 'mi-dia', label: 'Inicio', icon: 'Home' },
  { id: 'operacion', label: 'Operación', icon: 'Briefcase' },
  { id: 'gestion', label: 'Gestión', icon: 'BarChart3' },
  { id: 'plataforma', label: 'Plataforma', icon: 'Layers' },
  { id: 'setup', label: 'Setup', icon: 'Settings' },
]

export const SPACE_VISIBILITY_RULES: Record<SpaceId, SpaceVisibilityRule> = {
  'mi-dia': {
    visible_if: 'always',
  },
  operacion: {
    visible_if_has_any: [
      'personas.read',
      'personas.write',
      'asistencias.read',
      'asistencias.write',
      'reservas.read',
      'reservas.write',
      'caja.operar',
      'inventario.read',
      'inventario.write',
      'tickets.read',
      'tickets.write',
      'ccbp.plantel.read',
      'ccbp.salud.read_basic',
      'comunicaciones.send',
      'eventos.read',
      'eventos.write',
      'acceso.guardia',
      'cobranza.read',
      'ccbp.entrenamientos.read',
      'ccbp.scouting.read',
      'ccbp.partidos.cargar',
      'ccbp.torneos.admin',
      'concesiones.operar',
      'ccbp.utileria.admin',
      'ecommerce.read',
      'proyectos.read',
    ],
  },
  gestion: {
    visible_if_has_any: [
      'finanzas.read',
      'finanzas.reportes',
      'cobranza.read',
      'auditoria.read',
      'rrhh.read',
      'rrhh.admin',
      'documentos.read',
      'proyectos.admin',
      'pim.admin',
      'pim.read',
      'ecommerce.admin',
      'ccbp.plantel.read',
    ],
  },
  setup: {
    visible_if_has_any: [
      'setup.users',
      'setup.modulos',
      'setup.tenant',
      'setup.planes',
      'setup.catalogos',
      'setup.integraciones',
      'atributos_custom.admin',
      'ccbp.mapa.admin',
    ],
  },
  plataforma: {
    visible_if_has_attribute: 'sistema.admin',
  },
}
