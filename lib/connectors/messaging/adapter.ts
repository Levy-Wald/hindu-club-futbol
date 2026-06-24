// F5 pre-cableado — Adapter de mensajería externa (WhatsApp / SMS). ADR-035
// mock-first. Hoy WhatsApp es solo dato de contacto (wa.me links); este seam
// habilita el envío saliente real en F5 sin reescribir los call sites.
// Pensado para que notificaciones pueda despachar a un canal externo además de
// in-app cuando el conector esté activo (post-CUIT / cuenta de WhatsApp Business).

export interface MessageRequest {
  /** teléfono en formato internacional (ej. +5491150148932) */
  destinatario: string
  texto: string
  /** opcional: plantilla aprobada (WhatsApp Business) + variables */
  plantilla?: string
  variables?: Record<string, string>
  metadata?: Record<string, unknown>
}

export interface MessageResult {
  /** false en mock / cuando el canal externo no está habilitado todavía */
  disponible: boolean
  provider_id?: string
  error?: string
}

export interface MessagingAdapter {
  readonly name: string
  enviar(req: MessageRequest): Promise<MessageResult>
}
