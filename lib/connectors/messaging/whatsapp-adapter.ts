import type { MessagingAdapter, MessageRequest, MessageResult } from './adapter'

// ============================================================================
// STUB F5 — WhatsApp Business (Cloud API). NO implementar hasta tener la cuenta
// de WhatsApp Business + número verificado (post-CUIT).
// ----------------------------------------------------------------------------
// El seam ya está: cuando esté la cuenta, implementar enviar() contra la Cloud API
// (POST /{phone_number_id}/messages con plantilla aprobada), setear
// WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + MESSAGING_MODE=whatsapp. Ningún call site
// cambia: todos pasan por resolveMessagingAdapter().
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api
// ============================================================================
export class WhatsappAdapter implements MessagingAdapter {
  readonly name = 'whatsapp'
  async enviar(_req: MessageRequest): Promise<MessageResult> {
    throw new Error('WhatsappAdapter.enviar no implementado (F5).')
  }
}
