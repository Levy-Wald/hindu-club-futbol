// Types for the smart import wizard

export type FieldKey =
  | 'nombre'
  | 'apellido'
  | 'numero_documento'
  | 'tipo_documento'
  | 'email_principal'
  | 'telefono_principal'
  | 'fecha_nacimiento'
  | 'genero'
  | 'cuil_cuit'
  | 'direccion_calle'
  | 'direccion_numero'
  | 'direccion_ciudad'
  | 'direccion_provincia'
  | 'direccion_codigo_postal'
  | 'nacionalidad'
  | 'numero_socio'
  | 'tipo_socio'
  | 'estado_padron'

export const FIELD_OPTIONS: { value: FieldKey; label: string; group: string }[] = [
  // Identidad
  { value: 'nombre', label: 'Nombre', group: 'Identidad' },
  { value: 'apellido', label: 'Apellido', group: 'Identidad' },
  { value: 'numero_documento', label: 'Nro. Documento / DNI', group: 'Identidad' },
  { value: 'tipo_documento', label: 'Tipo Documento', group: 'Identidad' },
  { value: 'cuil_cuit', label: 'CUIL / CUIT', group: 'Identidad' },
  { value: 'fecha_nacimiento', label: 'Fecha Nacimiento', group: 'Identidad' },
  { value: 'genero', label: 'Género', group: 'Identidad' },
  { value: 'nacionalidad', label: 'Nacionalidad', group: 'Identidad' },
  // Contacto
  { value: 'email_principal', label: 'Email', group: 'Contacto' },
  { value: 'telefono_principal', label: 'Teléfono', group: 'Contacto' },
  // Dirección
  { value: 'direccion_calle', label: 'Calle', group: 'Dirección' },
  { value: 'direccion_numero', label: 'Número', group: 'Dirección' },
  { value: 'direccion_ciudad', label: 'Ciudad / Localidad', group: 'Dirección' },
  { value: 'direccion_provincia', label: 'Provincia', group: 'Dirección' },
  { value: 'direccion_codigo_postal', label: 'Código Postal', group: 'Dirección' },
  // Padrón
  { value: 'numero_socio', label: 'Nro. Socio', group: 'Padrón' },
  { value: 'tipo_socio', label: 'Tipo de Socio', group: 'Padrón' },
  { value: 'estado_padron', label: 'Estado en Padrón', group: 'Padrón' },
]

export interface ParsedData {
  headers: string[]
  rows: string[][]
  delimiter: string
  totalRows: number
}

export interface ColumnMapping {
  sourceIndex: number
  sourceHeader: string
  targetField: FieldKey | null
  confidence: number // 0-1, used for AI-detected mappings
}

export type DedupStatus = 'nueva' | 'match_exacto' | 'match_posible' | 'duplicada_en_lote'

export interface DedupResult {
  rowIndex: number
  status: DedupStatus
  matchedPersonaId: string | null
  matchedPersona: {
    id: string
    nombre: string
    apellido: string
    numero_documento: string | null
    email_principal: string | null
    telefono_principal: string | null
  } | null
  conflicts: FieldConflict[]
}

export interface FieldConflict {
  field: string
  fieldLabel: string
  currentValue: string | null
  newValue: string | null
  resolution: 'keep' | 'overwrite' | 'pending'
}

export interface ImportRow {
  rowIndex: number
  data: Partial<Record<FieldKey, string>>
  unmappedData: Record<string, string> // columns not mapped to system fields
  dedupResult: DedupResult | null
}

export interface ImportSummary {
  total: number
  nuevas: number
  vinculadas: number
  actualizadas: number
  errores: number
  detalleErrores: { row: number; message: string }[]
}
