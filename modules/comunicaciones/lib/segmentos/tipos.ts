export type SegmentoTipo = 'todos_activos' | 'equipo' | 'personas_ids_directos'

export type SegmentoConfig =
  | { tipo: 'todos_activos' }
  | { tipo: 'equipo'; equipo_id: string }
  | { tipo: 'personas_ids_directos'; persona_ids: string[] }

export type SegmentoResuelto = {
  tipo: SegmentoTipo
  parametros: Record<string, unknown>
  personas: Array<{
    id: string
    nombre: string
    apellido: string
    email_principal: string | null
    whatsapp: string | null
  }>
  total: number
}
