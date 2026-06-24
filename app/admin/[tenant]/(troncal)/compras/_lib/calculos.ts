// F1.14 — Lógica pura de Compras (sin DB), testeable en aislamiento.
// Las server actions de _actions.ts delegan acá las reglas de negocio.

export interface ItemMonto {
  cantidad: number
  precio_unitario: number
}

/** Total de una OC = suma de cantidad × precio_unitario de sus ítems. */
export function totalItems(items: ItemMonto[]): number {
  return items.reduce((acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0), 0)
}

export interface ItemRecepcion {
  cantidad: number
  cantidad_recibida: number
}

/**
 * Estado de una OC según lo recibido por ítem:
 *  - 'recibida_total'   → todos los ítems están completos (recibida >= pedida)
 *  - 'recibida_parcial' → algo se recibió pero falta
 *  - 'emitida'          → no se recibió nada todavía
 */
export function estadoOCPorRecepcion(items: ItemRecepcion[]): 'recibida_total' | 'recibida_parcial' | 'emitida' {
  if (items.length === 0) return 'emitida'
  const totalmente = items.every((it) => Number(it.cantidad_recibida) >= Number(it.cantidad))
  if (totalmente) return 'recibida_total'
  const algo = items.some((it) => Number(it.cantidad_recibida) > 0)
  return algo ? 'recibida_parcial' : 'emitida'
}

/** True si recibir `aRecibir` excede lo pendiente del ítem (no se puede recibir de más). */
export function excedePendiente(item: ItemRecepcion, aRecibir: number): boolean {
  return Number(item.cantidad_recibida) + Number(aRecibir) > Number(item.cantidad)
}
