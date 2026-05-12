export type CategoriaContenido =
  | 'transaccional'
  | 'eventos_club'
  | 'marketing'
  | 'partners'
  | 'torneos'

export type PreferenciasPersona = {
  id: string
  tenant_id: string
  persona_id: string
  idioma_preferido: string
  canal_preferido: string
  canal_emergencia: string | null
  horario_preferido_inicio: string
  horario_preferido_fin: string
  dias_no_contactar: string[]
  opt_in_marketing: boolean
  opt_in_eventos_club: boolean
  opt_in_partners: boolean
  opt_in_torneos: boolean
  frecuencia_resumen: string
  recibe_factura_papel: boolean
  recibe_revista_papel: boolean
}

export type ResultadoFiltro = {
  aEnviar: string[]
  filtrados: {
    opt_out: string[]
    horario: string[]
    dia_excluido: string[]
  }
}
