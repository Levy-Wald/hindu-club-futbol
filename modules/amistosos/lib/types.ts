export type LogisticaAmistoso = {
  color_camiseta_home: string | null
  color_camiseta_away: string | null
  contacto_rival_nombre: string | null
  contacto_rival_telefono: string | null
  contacto_rival_email: string | null
  club_rival_nombre: string | null
  observaciones: string | null
}

export type AmistosoCompleto = {
  evento: {
    id: string
    titulo: string
    fecha: string
    hora_inicio: string
    hora_fin: string | null
    cancha_id: string | null
    cancha_nombre: string | null
    equipo_id: string | null
    equipo_nombre: string | null
  }
  logistica: LogisticaAmistoso
  nomina_externa_id: string | null
  nomina_externa_token: string | null
  nomina_externa_estado: 'pendiente' | 'completada' | 'caducada' | 'cancelada' | null
}
