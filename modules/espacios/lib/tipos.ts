export type TipoEspacioSlug =
  | 'cancha_futbol'
  | 'cancha_tenis'
  | 'cancha_padel'
  | 'vestuario'
  | 'bar'
  | 'kiosko'
  | 'sala_reunion'
  | 'oficina'
  | 'aula'
  | 'gimnasio'
  | 'piscina'
  | 'vidriera'
  | 'deposito'
  | 'otro'

export type Espacio = {
  id: string
  tenant_id: string
  sede_id: string
  nombre: string
  tipo_slug: TipoEspacioSlug
  descripcion: string | null
  capacidad_personas: number | null
  dimensiones_m2: number | null
  activo: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type EspacioConSede = Espacio & {
  sede_nombre: string
}

export type EspacioInput = {
  sede_id: string
  nombre: string
  tipo_slug: TipoEspacioSlug
  descripcion?: string
  capacidad_personas?: number
  dimensiones_m2?: number
}

export type TipoEspacio = {
  slug: TipoEspacioSlug
  nombre: string
  descripcion: string | null
  activo: boolean
  orden: number | null
}
