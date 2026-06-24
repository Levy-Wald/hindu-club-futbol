import type { PaymentAdapter, CheckoutRequest, CheckoutResult, EstadoPago, WebhookEvent } from './adapter'

// ============================================================================
// STUB F5 — MercadoPago. NO implementar hasta que el CUIT esté aprobado.
// ----------------------------------------------------------------------------
// El seam ya está: cuando llegue el CUIT, completar estos 3 métodos contra la API
// de MercadoPago (Checkout Pro: crear preferencia → init_point; webhook de pagos;
// consulta de payment), setear MERCADOPAGO_ACCESS_TOKEN + PAYMENTS_MODE=mercadopago.
// El resto del sistema (server actions, botón Pagar) ya consume PaymentAdapter,
// así que no hay que reescribir nada afuera de este archivo.
//
// Referencia: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro
// ============================================================================
export class MercadopagoAdapter implements PaymentAdapter {
  readonly name = 'mercadopago'

  async crearCheckout(_req: CheckoutRequest): Promise<CheckoutResult> {
    // F5: POST /checkout/preferences con items + external_reference + back_urls +
    // notification_url → devolver { disponible: true, checkout_id: pref.id, url: pref.init_point }
    throw new Error('MercadopagoAdapter.crearCheckout no implementado (F5).')
  }

  async consultarEstado(_checkoutId: string): Promise<EstadoPago> {
    // F5: GET /v1/payments/{id} → mapear status (approved/pending/rejected/cancelled)
    throw new Error('MercadopagoAdapter.consultarEstado no implementado (F5).')
  }

  async verificarWebhook(_payload: unknown, _signature?: string): Promise<WebhookEvent | null> {
    // F5: validar firma (x-signature) + GET del payment → normalizar a WebhookEvent
    throw new Error('MercadopagoAdapter.verificarWebhook no implementado (F5).')
  }
}
