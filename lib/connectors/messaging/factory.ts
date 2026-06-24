import type { MessagingAdapter } from './adapter'
import { MockMessagingAdapter } from './mock-adapter'
import { WhatsappAdapter } from './whatsapp-adapter'

let cached: MessagingAdapter | null = null

// Resuelve el adapter de mensajería según MESSAGING_MODE (default 'mock').
// En F5: MESSAGING_MODE=whatsapp + WHATSAPP_TOKEN / WHATSAPP_PHONE_ID.
export function resolveMessagingAdapter(): MessagingAdapter {
  if (cached) return cached
  const mode = process.env.MESSAGING_MODE || 'mock'
  switch (mode) {
    case 'mock':
      cached = new MockMessagingAdapter()
      break
    case 'whatsapp':
      cached = new WhatsappAdapter()
      break
    default:
      throw new Error(`MESSAGING_MODE desconocido: ${mode}. Válidos: mock | whatsapp`)
  }
  return cached
}
