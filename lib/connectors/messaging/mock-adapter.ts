import type { MessagingAdapter, MessageRequest, MessageResult } from './adapter'

// Mock: no envía nada real. Loguea y devuelve disponible=false. Default hasta F5.
export class MockMessagingAdapter implements MessagingAdapter {
  readonly name = 'mock'
  async enviar(req: MessageRequest): Promise<MessageResult> {
    console.log(`[MockMessagingAdapter] (no enviado) → ${req.destinatario}: ${req.texto.slice(0, 60)}`)
    return { disponible: false, error: 'Mensajería externa (WhatsApp) se habilita en F5.' }
  }
}
