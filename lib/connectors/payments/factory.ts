import type { PaymentAdapter } from './adapter'
import { MockPaymentAdapter } from './mock-adapter'
import { MercadopagoAdapter } from './mercadopago-adapter'

let cached: PaymentAdapter | null = null

// Resuelve el adapter de pagos según PAYMENTS_MODE (default 'mock'). En F5, con el
// CUIT aprobado: PAYMENTS_MODE=mercadopago + MERCADOPAGO_ACCESS_TOKEN.
export function resolvePaymentAdapter(): PaymentAdapter {
  if (cached) return cached
  const mode = process.env.PAYMENTS_MODE || 'mock'
  switch (mode) {
    case 'mock':
      cached = new MockPaymentAdapter()
      break
    case 'mercadopago':
      cached = new MercadopagoAdapter()
      break
    default:
      throw new Error(`PAYMENTS_MODE desconocido: ${mode}. Válidos: mock | mercadopago`)
  }
  return cached
}
