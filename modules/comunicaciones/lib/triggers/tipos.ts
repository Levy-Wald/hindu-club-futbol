export interface TriggerResult {
  job_slug: string
  personas_encontradas: number
  personas_notificadas: number
  personas_dedup: number
  errores: number
  lote_id: string | null
  detalles: string[]
}

export interface TriggerConfig {
  job_slug: string
  plantilla_slug: string
  canal: 'email' | 'inapp'
  origen_modulo_slug: string
}
