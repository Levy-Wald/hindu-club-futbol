'use server'

import { resolvePaymentAdapter } from '@/lib/connectors/payments/factory'
import type { CheckoutResult } from '@/lib/connectors/payments/adapter'

// F5 pre-cableado: inicia el pago online de una cuota vía el PaymentAdapter.
// Hoy (mock) devuelve disponible=false con el aviso. En F5 (MercadoPago) devolverá
// disponible=true + url de checkout, y el botón redirige — sin cambios de UI.
export async function iniciarPagoCuota(input: {
  cuotaId: string
  periodo: string | null
  monto: number
  moneda: string
}): Promise<CheckoutResult> {
  const adapter = resolvePaymentAdapter()
  return adapter.crearCheckout({
    referencia_externa: input.cuotaId,
    monto: input.monto,
    moneda: input.moneda,
    descripcion: `Cuota ${input.periodo ?? ''}`.trim(),
  })
}
