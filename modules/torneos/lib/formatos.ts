import type { FormatoTorneo } from './types'

export type FormatoInfo = {
  slug: FormatoTorneo
  nombre: string
  descripcion: string
  num_equipos_min: number
  num_equipos_max: number | null
  num_equipos_default: number
}

export const FORMATOS: FormatoInfo[] = [
  {
    slug: 'liga',
    nombre: 'Liga (todos contra todos)',
    descripcion: 'Cada equipo juega contra todos los demas. Puede ser ida y vuelta.',
    num_equipos_min: 3,
    num_equipos_max: null,
    num_equipos_default: 10,
  },
  {
    slug: 'eliminacion',
    nombre: 'Eliminacion directa',
    descripcion: 'Pierde y queda afuera. Bracket de octavos/cuartos/semis/final.',
    num_equipos_min: 4,
    num_equipos_max: 64,
    num_equipos_default: 8,
  },
  {
    slug: 'grupos_playoff',
    nombre: 'Fase de grupos + playoff',
    descripcion: 'Liga en grupos primero, luego eliminacion entre los mejores.',
    num_equipos_min: 6,
    num_equipos_max: 32,
    num_equipos_default: 16,
  },
  {
    slug: 'suizo',
    nombre: 'Sistema suizo',
    descripcion: 'No se elimina nadie pero los equipos se emparejan por rendimiento ronda a ronda.',
    num_equipos_min: 6,
    num_equipos_max: null,
    num_equipos_default: 12,
  },
  {
    slug: 'triangular',
    nombre: 'Triangular',
    descripcion: 'Solo 3 equipos. Todos contra todos en 1 dia o pocos partidos.',
    num_equipos_min: 3,
    num_equipos_max: 3,
    num_equipos_default: 3,
  },
  {
    slug: 'cuadrangular',
    nombre: 'Cuadrangular',
    descripcion: '4 equipos, todos contra todos o eliminacion en 2 dias.',
    num_equipos_min: 4,
    num_equipos_max: 4,
    num_equipos_default: 4,
  },
]

export function getFormato(slug: FormatoTorneo): FormatoInfo | undefined {
  return FORMATOS.find((f) => f.slug === slug)
}
