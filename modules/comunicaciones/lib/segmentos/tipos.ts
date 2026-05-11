export type SegmentoTipo = 'todos_activos' | 'equipo'

export type SegmentoConfig =
  | { tipo: 'todos_activos' }
  | { tipo: 'equipo'; equipo_id: string }

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
