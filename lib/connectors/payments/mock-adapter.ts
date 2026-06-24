import type { PaymentAdapter, CheckoutRequest, CheckoutResult, EstadoPago, WebhookEvent } from './adapter'

// Mock: NO cobra ni muta plata. Devuelve disponible=false para que la UI muestre
// "pago online próximamente" sin falsear ningún estado financiero. Es el default
// hasta F5 (CUIT + MercadoPago).
export class MockPaymentAdapter implements PaymentAdapter {
  readonly name = 'mock'

  async crearCheckout(_req: CheckoutRequest): Promise<CheckoutResult> {
    return {
      disponible: false,
      error: 'El pago online se habilita en F5 (MercadoPago, pendiente de CUIT).',
    }
  }

  async consultarEstado(_checkoutId: string): Promise<EstadoPago> {
    return 'desconocido'
  }

  async verificarWebhook(_payload: unknown, _signature?: string): Promise<WebhookEvent | null> {
    return null
  }
}
