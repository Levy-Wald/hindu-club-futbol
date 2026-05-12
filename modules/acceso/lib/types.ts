export type VeredictoAcceso = 'verde' | 'amarillo' | 'rojo'

export type MotivoAcceso =
  | { tipo: 'socio_activo'; descripcion: string }
  | { tipo: 'invitaciones_hoy'; eventos: EventoMinimal[] }
  | { tipo: 'invitaciones_otro_dia'; eventos: EventoMinimal[] }
  | { tipo: 'sin_acceso'; descripcion: string }
  | { tipo: 'no_encontrado'; descripcion: string }

export type EventoMinimal = {
  evento_id: string
  evento_invitado_id?: string
  titulo: string
  tipo_evento_slug?: string
  fecha?: string
  hora_inicio?: string
}

export type ResultadoVerificacion = {
  veredicto: VeredictoAcceso
  es_socio: boolean
  invitaciones_hoy: EventoMinimal[]
  invitaciones_otro_dia: EventoMinimal[]
  motivos: MotivoAcceso[]
  persona_id: string
  nombre: string
  apellido: string
  foto_url: string | null
  dni: string
  acceso_log_id: string
}

export type LecturaHistorial = {
  id: string
  dni: string
  nombre: string | null
  apellido: string | null
  veredicto: VeredictoAcceso
  timestamp: string
}
