// F5 pre-cableado — Adapter de pagos online (ADR-035 mock-first).
// Capa 3 (Conectores). Hoy 'mock' (no cobra): el cobro real con MercadoPago se
// habilita en F5, bloqueado por el CUIT en trámite. Cuando llegue: implementar
// MercadopagoAdapter (el stub ya está) y PAYMENTS_MODE=mercadopago. Ningún caller
// cambia: todos pasan por resolvePaymentAdapter().

export interface CheckoutRequest {
  /** referencia interna del cobro (ej. cuota_id) para reconciliar el webhook */
  referencia_externa: string
  monto: number
  moneda: string
  descripcion: string
  /** datos opcionales del pagador */
  pagador_email?: string | null
  pagador_nombre?: string | null
  /** a dónde vuelve el usuario tras pagar */
  url_retorno?: string | null
  metadata?: Record<string, unknown>
}

export interface CheckoutResult {
  /** false en mock / cuando el cobro online no está habilitado todavía */
  disponible: boolean
  checkout_id?: string
  /** URL de pago a la que redirigir al socio (init_point de MP) */
  url?: string
  error?: string
}

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'desconocido'

export interface WebhookEvent {
  checkout_id: string
  referencia_externa: string
  estado: EstadoPago
  monto?: number
  provider_payment_id?: string
  raw?: unknown
}

export interface PaymentAdapter {
  readonly name: string
  /** crea un checkout/preferencia y devuelve la URL de pago */
  crearCheckout(req: CheckoutRequest): Promise<CheckoutResult>
  /** consulta el estado de un pago (polling / fallback de webhook) */
  consultarEstado(checkoutId: string): Promise<EstadoPago>
  /** valida y normaliza un webhook entrante del proveedor */
  verificarWebhook(payload: unknown, signature?: string): Promise<WebhookEvent | null>
}
