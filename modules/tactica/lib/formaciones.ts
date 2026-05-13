export type SlotFormacion = {
  slug: string
  nombre: string
  x: number
  y: number
  linea: 'arquero' | 'defensa' | 'mediocampo' | 'ataque'
}

export type Formacion = {
  slug: string
  nombre: string
  descripcion: string
  num_jugadores: 11
  slots: SlotFormacion[]
}

export const FORMACIONES: Formacion[] = [
  {
    slug: '4-4-2',
    nombre: '4-4-2',
    descripcion: 'Clásico equilibrio entre defensa, medio y ataque.',
    num_jugadores: 11,
    slots: [
      { slug: 'arquero', nombre: 'Arquero', x: 50, y: 10, linea: 'arquero' },
      { slug: 'lateral_derecho', nombre: 'Lateral derecho', x: 80, y: 30, linea: 'defensa' },
      { slug: 'central_derecho', nombre: 'Central derecho', x: 60, y: 25, linea: 'defensa' },
      { slug: 'central_izquierdo', nombre: 'Central izquierdo', x: 40, y: 25, linea: 'defensa' },
      { slug: 'lateral_izquierdo', nombre: 'Lateral izquierdo', x: 20, y: 30, linea: 'defensa' },
      { slug: 'volante_derecho', nombre: 'Volante derecho', x: 75, y: 55, linea: 'mediocampo' },
      { slug: 'mediocampista_central_der', nombre: 'MC derecho', x: 55, y: 50, linea: 'mediocampo' },
      { slug: 'mediocampista_central_izq', nombre: 'MC izquierdo', x: 45, y: 50, linea: 'mediocampo' },
      { slug: 'volante_izquierdo', nombre: 'Volante izquierdo', x: 25, y: 55, linea: 'mediocampo' },
      { slug: 'delantero_derecho', nombre: 'Delantero derecho', x: 60, y: 80, linea: 'ataque' },
      { slug: 'delantero_izquierdo', nombre: 'Delantero izquierdo', x: 40, y: 80, linea: 'ataque' },
    ],
  },
  {
    slug: '4-3-3',
    nombre: '4-3-3',
    descripcion: 'Ataque amplio con extremos abiertos.',
    num_jugadores: 11,
    slots: [
      { slug: 'arquero', nombre: 'Arquero', x: 50, y: 10, linea: 'arquero' },
      { slug: 'lateral_derecho', nombre: 'Lateral derecho', x: 80, y: 30, linea: 'defensa' },
      { slug: 'central_derecho', nombre: 'Central derecho', x: 60, y: 25, linea: 'defensa' },
      { slug: 'central_izquierdo', nombre: 'Central izquierdo', x: 40, y: 25, linea: 'defensa' },
      { slug: 'lateral_izquierdo', nombre: 'Lateral izquierdo', x: 20, y: 30, linea: 'defensa' },
      { slug: 'mediocampista_defensivo', nombre: 'MC defensivo', x: 50, y: 45, linea: 'mediocampo' },
      { slug: 'interior_derecho', nombre: 'Interior derecho', x: 65, y: 55, linea: 'mediocampo' },
      { slug: 'interior_izquierdo', nombre: 'Interior izquierdo', x: 35, y: 55, linea: 'mediocampo' },
      { slug: 'extremo_derecho', nombre: 'Extremo derecho', x: 80, y: 80, linea: 'ataque' },
      { slug: 'centro_delantero', nombre: 'Centro delantero', x: 50, y: 85, linea: 'ataque' },
      { slug: 'extremo_izquierdo', nombre: 'Extremo izquierdo', x: 20, y: 80, linea: 'ataque' },
    ],
  },
  {
    slug: '4-2-3-1',
    nombre: '4-2-3-1',
    descripcion: 'Doble pivote y enganche detrás del 9.',
    num_jugadores: 11,
    slots: [
      { slug: 'arquero', nombre: 'Arquero', x: 50, y: 10, linea: 'arquero' },
      { slug: 'lateral_derecho', nombre: 'Lateral derecho', x: 80, y: 30, linea: 'defensa' },
      { slug: 'central_derecho', nombre: 'Central derecho', x: 60, y: 25, linea: 'defensa' },
      { slug: 'central_izquierdo', nombre: 'Central izquierdo', x: 40, y: 25, linea: 'defensa' },
      { slug: 'lateral_izquierdo', nombre: 'Lateral izquierdo', x: 20, y: 30, linea: 'defensa' },
      { slug: 'pivote_derecho', nombre: 'Pivote derecho', x: 60, y: 45, linea: 'mediocampo' },
      { slug: 'pivote_izquierdo', nombre: 'Pivote izquierdo', x: 40, y: 45, linea: 'mediocampo' },
      { slug: 'enganche_derecho', nombre: 'Enganche derecho', x: 70, y: 65, linea: 'mediocampo' },
      { slug: 'enganche_central', nombre: 'Enganche central', x: 50, y: 70, linea: 'mediocampo' },
      { slug: 'enganche_izquierdo', nombre: 'Enganche izquierdo', x: 30, y: 65, linea: 'mediocampo' },
      { slug: 'centro_delantero', nombre: 'Centro delantero', x: 50, y: 88, linea: 'ataque' },
    ],
  },
  {
    slug: '3-5-2',
    nombre: '3-5-2',
    descripcion: 'Tres en el fondo con carrileros ofensivos.',
    num_jugadores: 11,
    slots: [
      { slug: 'arquero', nombre: 'Arquero', x: 50, y: 10, linea: 'arquero' },
      { slug: 'central_derecho', nombre: 'Central derecho', x: 70, y: 25, linea: 'defensa' },
      { slug: 'central_central', nombre: 'Central central', x: 50, y: 25, linea: 'defensa' },
      { slug: 'central_izquierdo', nombre: 'Central izquierdo', x: 30, y: 25, linea: 'defensa' },
      { slug: 'carrilero_derecho', nombre: 'Carrilero derecho', x: 85, y: 55, linea: 'mediocampo' },
      { slug: 'volante_derecho', nombre: 'Volante derecho', x: 65, y: 50, linea: 'mediocampo' },
      { slug: 'mediocampista_central', nombre: 'MC central', x: 50, y: 50, linea: 'mediocampo' },
      { slug: 'volante_izquierdo', nombre: 'Volante izquierdo', x: 35, y: 50, linea: 'mediocampo' },
      { slug: 'carrilero_izquierdo', nombre: 'Carrilero izquierdo', x: 15, y: 55, linea: 'mediocampo' },
      { slug: 'delantero_derecho', nombre: 'Delantero derecho', x: 60, y: 82, linea: 'ataque' },
      { slug: 'delantero_izquierdo', nombre: 'Delantero izquierdo', x: 40, y: 82, linea: 'ataque' },
    ],
  },
  {
    slug: '5-3-2',
    nombre: '5-3-2',
    descripcion: 'Bloque defensivo bajo con contraataque.',
    num_jugadores: 11,
    slots: [
      { slug: 'arquero', nombre: 'Arquero', x: 50, y: 10, linea: 'arquero' },
      { slug: 'carrilero_derecho', nombre: 'Carrilero derecho', x: 85, y: 30, linea: 'defensa' },
      { slug: 'central_derecho', nombre: 'Central derecho', x: 65, y: 25, linea: 'defensa' },
      { slug: 'central_central', nombre: 'Central central', x: 50, y: 22, linea: 'defensa' },
      { slug: 'central_izquierdo', nombre: 'Central izquierdo', x: 35, y: 25, linea: 'defensa' },
      { slug: 'carrilero_izquierdo', nombre: 'Carrilero izquierdo', x: 15, y: 30, linea: 'defensa' },
      { slug: 'mediocampista_derecho', nombre: 'MC derecho', x: 65, y: 55, linea: 'mediocampo' },
      { slug: 'mediocampista_central', nombre: 'MC central', x: 50, y: 50, linea: 'mediocampo' },
      { slug: 'mediocampista_izquierdo', nombre: 'MC izquierdo', x: 35, y: 55, linea: 'mediocampo' },
      { slug: 'delantero_derecho', nombre: 'Delantero derecho', x: 60, y: 82, linea: 'ataque' },
      { slug: 'delantero_izquierdo', nombre: 'Delantero izquierdo', x: 40, y: 82, linea: 'ataque' },
    ],
  },
]

export function getFormacionPorSlug(slug: string): Formacion | undefined {
  return FORMACIONES.find(f => f.slug === slug)
}
