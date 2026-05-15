/**
 * Pure function to resolve the current effective price from a list of prices
 * with optional vigencia (validity) dates.
 */

export interface PrecioConVigencia {
  id: string
  precio: number
  moneda: string
  fecha_vigencia_desde: string | null
  fecha_vigencia_hasta: string | null
}

/**
 * Given a list of prices with optional vigencia dates, returns the
 * currently effective price for the given date.
 *
 * Resolution rules:
 * 1. Filter prices where fecha_vigencia_desde <= fecha <= fecha_vigencia_hasta
 *    (null desde = -infinity, null hasta = +infinity)
 * 2. Among valid prices, pick the one with the most recent fecha_vigencia_desde
 * 3. If no prices are valid, return null
 */
export function resolverPrecioVigente(
  precios: PrecioConVigencia[],
  fecha: Date
): PrecioConVigencia | null {
  if (precios.length === 0) return null

  const fechaStr = fecha.toISOString().split('T')[0] // YYYY-MM-DD

  const vigentes = precios.filter(p => {
    if (p.fecha_vigencia_desde && p.fecha_vigencia_desde > fechaStr) return false
    if (p.fecha_vigencia_hasta && p.fecha_vigencia_hasta < fechaStr) return false
    return true
  })

  if (vigentes.length === 0) return null

  // Sort by fecha_vigencia_desde descending (most recent first)
  // null desde treated as very old (sort last)
  vigentes.sort((a, b) => {
    const desdeA = a.fecha_vigencia_desde ?? '0000-01-01'
    const desdeB = b.fecha_vigencia_desde ?? '0000-01-01'
    return desdeB.localeCompare(desdeA)
  })

  return vigentes[0]
}
