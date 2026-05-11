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

export interface ComunicacionAdapter {
  readonly name: string
  enviar(request: EnvioRequest): Promise<EnvioResult>
}
