/**
 * Pure validation and calculation functions for stock movements.
 * Extracted from stock.ts server action for testability.
 */

export type TipoMovimiento = 'entrada' | 'salida' | 'transferencia' | 'ajuste'

export interface StockMovInput {
  tipo: TipoMovimiento
  cantidad: number
  espacio_origen_id: string | null
  espacio_destino_id: string | null
}

/**
 * Validates that the tipo + espacio combination is valid.
 */
export function validarTipoEspacio(input: StockMovInput): { valid: boolean; error?: string } {
  if (input.tipo === 'entrada' && !input.espacio_destino_id) {
    return { valid: false, error: 'Entrada requiere espacio destino' }
  }
  if (input.tipo === 'salida' && !input.espacio_origen_id) {
    return { valid: false, error: 'Salida requiere espacio origen' }
  }
  if (input.tipo === 'transferencia') {
    if (!input.espacio_origen_id || !input.espacio_destino_id) {
      return { valid: false, error: 'Transferencia requiere origen y destino' }
    }
    if (input.espacio_origen_id === input.espacio_destino_id) {
      return { valid: false, error: 'Origen y destino deben ser distintos' }
    }
  }
  if (input.tipo === 'ajuste' && !input.espacio_destino_id) {
    return { valid: false, error: 'Ajuste requiere espacio' }
  }
  return { valid: true }
}

/**
 * Calculates the resulting stock for each espacio after a movement.
 * Returns deltas per espacio.
 */
export function calcularDeltasStock(
  tipo: TipoMovimiento,
  cantidad: number,
  stockOrigen: number,
  stockDestino: number
): { ok: true; nuevoOrigen: number; nuevoDestino: number } | { ok: false; error: string } {
  if (cantidad <= 0) {
    return { ok: false, error: 'Cantidad debe ser positiva' }
  }

  switch (tipo) {
    case 'entrada':
      return { ok: true, nuevoOrigen: stockOrigen, nuevoDestino: stockDestino + cantidad }

    case 'salida':
      if (stockOrigen < cantidad) {
        return { ok: false, error: `Stock insuficiente. Disponible: ${stockOrigen}, solicitado: ${cantidad}` }
      }
      return { ok: true, nuevoOrigen: stockOrigen - cantidad, nuevoDestino: stockDestino }

    case 'transferencia':
      if (stockOrigen < cantidad) {
        return { ok: false, error: `Stock insuficiente. Disponible: ${stockOrigen}, solicitado: ${cantidad}` }
      }
      return { ok: true, nuevoOrigen: stockOrigen - cantidad, nuevoDestino: stockDestino + cantidad }

    case 'ajuste':
      return { ok: true, nuevoOrigen: stockOrigen, nuevoDestino: cantidad }
  }
}
