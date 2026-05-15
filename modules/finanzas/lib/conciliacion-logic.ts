/**
 * Pure functions for conciliacion auto-match logic.
 * Extracted from conciliacion.ts server action for testability.
 */

export interface FilaBancariaMatch {
  monto: number
  fecha_operacion: string
}

export interface MovimientoSistema {
  id: string
  tipo: string
  monto_neto: number
  fecha: string
}

export interface MatchTolerancia {
  toleranciaPesos: number
  toleranciaDias: number
}

export interface MatchResult {
  match: MovimientoSistema | null
  candidatos: MovimientoSistema[]
  confidence: 'alta' | 'media' | 'baja' | 'sin_match'
}

/**
 * Determines compatible movement types based on the sign of the bank row amount.
 * Positive amounts → income or transfer
 * Negative amounts → expense or transfer
 */
export function tiposCandidatos(monto: number): string[] {
  return monto > 0
    ? ['ingreso', 'transferencia']
    : ['egreso', 'transferencia']
}

/**
 * Checks if a single movimiento is a candidate match for a bank row.
 */
export function esCandidato(
  fila: FilaBancariaMatch,
  mov: MovimientoSistema,
  tolerancia: MatchTolerancia
): boolean {
  const montoFila = Number(fila.monto)
  const absMontoFila = Math.abs(montoFila)
  const tipos = tiposCandidatos(montoFila)

  if (!tipos.includes(mov.tipo)) return false
  if (Math.abs(Number(mov.monto_neto) - absMontoFila) > tolerancia.toleranciaPesos) return false

  const fechaMov = new Date(mov.fecha + 'T12:00:00')
  const fechaFila = new Date(fila.fecha_operacion + 'T12:00:00')
  const diffDays = Math.abs(Math.round((fechaMov.getTime() - fechaFila.getTime()) / 86400000))
  if (diffDays > tolerancia.toleranciaDias) return false

  return true
}

/**
 * Finds the best match for a bank row among available system movements.
 * Returns the match result with confidence level.
 *
 * - 1 candidate → alta confidence, returns match
 * - >1 candidates → media confidence, returns closest by date
 * - 0 candidates → sin_match
 */
export function findBestMatch(
  fila: FilaBancariaMatch,
  movimientos: MovimientoSistema[],
  tolerancia: MatchTolerancia
): MatchResult {
  const candidatos = movimientos.filter(m => esCandidato(fila, m, tolerancia))

  if (candidatos.length === 0) {
    return { match: null, candidatos: [], confidence: 'sin_match' }
  }

  if (candidatos.length === 1) {
    return { match: candidatos[0], candidatos, confidence: 'alta' }
  }

  // Multiple candidates: pick closest by date
  const fechaFila = new Date(fila.fecha_operacion + 'T12:00:00').getTime()
  const sorted = [...candidatos].sort((a, b) => {
    const diffA = Math.abs(new Date(a.fecha + 'T12:00:00').getTime() - fechaFila)
    const diffB = Math.abs(new Date(b.fecha + 'T12:00:00').getTime() - fechaFila)
    return diffA - diffB
  })

  return { match: sorted[0], candidatos, confidence: 'media' }
}

/**
 * Normalizes a raw amount string to a number.
 * Handles Argentine format: 1.234,56 → 1234.56
 */
export function normalizeMonto(raw: string): number {
  if (!raw) return NaN
  const cleaned = raw.replace(/[$ ]/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned)
}

/**
 * Normalizes a raw date string to YYYY-MM-DD.
 * Supports: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
 */
export function normalizeDate(raw: string): string | null {
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match) {
    const [, d, m, y] = match
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}
