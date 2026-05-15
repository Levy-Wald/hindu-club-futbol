export type TipoDato = 'texto' | 'numero' | 'fecha' | 'booleano' | 'select' | 'multi_select'
export type AplicaA = 'persona' | 'entidad' | 'producto' | 'evento'

export interface AtributoDefinicion {
  id: string
  tenant_id: string
  slug: string
  nombre: string
  descripcion: string | null
  aplica_a: AplicaA
  obligatorio: boolean
  tipo_dato: TipoDato
  opciones: string[] | null
  validacion: Record<string, unknown> | null
  valor_default: string | null
  orden: number
  visible_en_listado: boolean
  visible_en_filtro: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface AtributoValor {
  id: string
  tenant_id: string
  definicion_id: string
  entidad_tipo: AplicaA
  entidad_id: string
  valor: string | null
  valor_jsonb: unknown | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface AtributoValorConDefinicion extends AtributoValor {
  definicion?: AtributoDefinicion
}

export const TIPO_DATO_LABELS: Record<TipoDato, string> = {
  texto: 'Texto',
  numero: 'Número',
  fecha: 'Fecha',
  booleano: 'Sí/No',
  select: 'Selección única',
  multi_select: 'Selección múltiple',
}

export const APLICA_A_LABELS: Record<AplicaA, string> = {
  persona: 'Personas',
  entidad: 'Entidades',
  producto: 'Productos',
  evento: 'Eventos',
}

// Vinculos cross types
export type OrigenDestinoTipo = 'persona' | 'entidad'

export interface VinculoCross {
  id: string
  tenant_id: string
  origen_tipo: OrigenDestinoTipo
  origen_id: string
  destino_tipo: OrigenDestinoTipo
  destino_id: string
  tipo_vinculo: string
  notas: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface VinculoCrossConRelaciones extends VinculoCross {
  origen_nombre?: string
  destino_nombre?: string
}

export const TIPOS_VINCULO_PERSONA_ENTIDAD = [
  { slug: 'socio', nombre: 'Socio/a' },
  { slug: 'empleado', nombre: 'Empleado/a' },
  { slug: 'cliente', nombre: 'Cliente' },
  { slug: 'proveedor', nombre: 'Proveedor' },
  { slug: 'representante', nombre: 'Representante' },
  { slug: 'otro', nombre: 'Otro' },
]

export const TIPOS_VINCULO_ENTIDAD_ENTIDAD = [
  { slug: 'empresa_matriz', nombre: 'Empresa matriz' },
  { slug: 'sucursal', nombre: 'Sucursal' },
  { slug: 'partner', nombre: 'Partner' },
  { slug: 'proveedor', nombre: 'Proveedor' },
  { slug: 'cliente', nombre: 'Cliente' },
  { slug: 'otro', nombre: 'Otro' },
]
