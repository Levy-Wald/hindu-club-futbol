/**
 * Adapter interface for the comunicaciones motor.
 * Sprint FASE 2.1 — mock-first, real adapters later.
 */

export interface EnvioRequest {
  canal: 'email' | 'inapp'
  destinatario: string // email address or persona_id
  asunto: string
  cuerpo: string
  metadata?: Record<string, unknown>
}

export interface EnvioResult {
  success: boolean
  provider_id?: string
  error?: string
}

export interface EnvioMasivoRow {
  persona_id: string
  canal: string
  destinatario: string | null
  plantilla_slug: string
  asunto: string | null
  cuerpo_renderizado: string
  estado: string
  error_mensaje: string | null
  enviado_at: string | null
  origen_modulo_slug: string
  origen_entidad_id: string | null
  metadata: Record<string, unknown>
}

export interface ComunicacionAdapter {
  readonly name: string
  enviar(request: EnvioRequest): Promise<EnvioResult>
  enviarMasivo(tenantId: string, envios: EnvioMasivoRow[], supabaseClient?: import('@supabase/supabase-js').SupabaseClient): Promise<void>
}
