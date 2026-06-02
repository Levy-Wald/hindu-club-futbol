import type { Space, SpaceId, SpaceVisibilityRule } from './types'

// F1.8 (ADR-066): áreas del club por mundo-del-club, en orden canónico:
// inicio, personas, actividad, comercial, operaciones, finanzas, comunicacion,
// configuracion. (admin_scl no tiene tab de BO del club; recursos/marketing
// quedaron vacías y se retiran de los tabs.)
export const SPACES: Space[] = [
  { id: 'inicio', label: 'Inicio', icon: 'Home' },
  { id: 'personas', label: 'Personas', icon: 'Users' },
  { id: 'actividad', label: 'Actividad', icon: 'Calendar' },
  { id: 'comercial', label: 'Comercial', icon: 'ShoppingCart' },
  { id: 'operaciones', label: 'Operaciones', icon: 'Boxes' },
  { id: 'finanzas', label: 'Finanzas', icon: 'TrendingUp' },
  { id: 'comunicacion', label: 'Comunicación', icon: 'Megaphone' },
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
  // F1.8 (ADR-066): comercial + operaciones reemplazan a recursos; comunicacion a marketing.
  comercial: {
    visible_if_has_any: [
      'pim.read',
      'pim.admin',
      'ecommerce.read',
      'ecommerce.admin',
    ],
  },
  operaciones: {
    visible_if_has_any: [
      'inventario.read',
      'inventario.write',
      'reservas.read',
      'ccbp.utileria.admin',
      'ccbp.mapa.admin',
      'proyectos.read',
      'proyectos.admin',
    ],
  },
  comunicacion: {
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
  // Legacy (sin tab; mantenidas por completitud de tipos Record<SpaceId>).
  marketing: {
    visible_if_has_any: ['comunicaciones.send', 'personas.write'],
  },
  recursos: {
    visible_if_has_any: ['pim.read', 'pim.admin', 'inventario.read', 'reservas.read', 'proyectos.read'],
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
