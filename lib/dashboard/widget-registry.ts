import type { WidgetDef } from './types'

export const WIDGET_REGISTRY: WidgetDef[] = [
  {
    id: 'saludo',
    title: 'Bienvenida',
    priority: 1,
    condition: { always: true },
    size: 'lg',
  },
  {
    id: 'mi-membresia',
    title: 'Mi membresía',
    priority: 2,
    condition: { hasAnyAttribute: ['socio', 'suscriptor', 'socio_padron'] },
    size: 'sm',
  },
  {
    id: 'mi-actividad-deportiva',
    title: 'Mi actividad deportiva',
    priority: 3,
    condition: { hasAnyAttribute: ['jugador', 'capitan', 'subcapitan'] },
    size: 'md',
  },
  {
    id: 'pendientes-admin',
    title: 'Pendientes admin',
    priority: 4,
    condition: { hasAnyCapability: ['personas.admin', 'setup.tenant', 'finanzas.admin'] },
    size: 'md',
  },
  {
    id: 'cuotas-vencidas',
    title: 'Cuotas vencidas',
    priority: 5,
    condition: { hasAnyCapability: ['finanzas.read', 'cobranza.read'] },
    size: 'sm',
  },
  {
    id: 'salud-club',
    title: 'Salud del club',
    priority: 6,
    condition: {
      hasAnyAttribute: [
        'staff_medico',
        'staff_acceso_total_salud',
        'medico_club',
        'kine_club',
      ],
    },
    size: 'sm',
  },
  {
    id: 'mis-tareas',
    title: 'Mis tareas',
    priority: 9,
    condition: { hasAnyCapability: ['proyectos.read'] },
    size: 'md',
  },
  {
    id: 'comunicaciones',
    title: 'Comunicaciones',
    priority: 10,
    condition: { hasAnyCapability: ['comunicaciones.send', 'comunicaciones.admin'] },
    size: 'sm',
  },
]
