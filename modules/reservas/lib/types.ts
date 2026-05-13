export type EstadoReserva =
  | 'pendiente'
  | 'confirmada'
  | 'pagada'
  | 'cancelada'
  | 'completada'

export type Reserva = {
  id: string
  tenant_id: string
  evento_id: string
  cancha_id: string
  persona_id: string | null
  entidad_id: string | null
  cliente_nombre_externo: string | null
  cliente_contacto_telefono: string | null
  cliente_contacto_email: string | null
  tarifa_hora: number | null
  duracion_horas: number | null
  tarifa_total: number | null
  estado: EstadoReserva
  fecha_pago: string | null
  metodo_pago: string | null
  notas: string | null
  created_at: string
}

export type ReservaHidratada = Reserva & {
  evento: {
    fecha: string
    hora_inicio: string
    hora_fin: string | null
  }
  cancha: {
    nombre: string
    tipo: string | null
  }
  cliente_display: string
}

export type CanchaDisponible = {
  id: string
  nombre: string
  tipo: string
  precio_alquiler_hora: number | null
  sede_nombre: string | null
}
