// F6.6 — Lógica pura de Rendición de gastos (sin DB), testeable.

export type EstadoRendicion = 'borrador' | 'presentada' | 'aprobada' | 'rechazada' | 'liquidada'

/** Total de una rendición = suma de los montos de sus ítems. */
export function totalRendicion(items: { monto: number }[]): number {
  return items.reduce((acc, i) => acc + (Number(i.monto) || 0), 0)
}

// Máquina de estados (sin aprobaciones multinivel):
//   borrador → presentada → aprobada → liquidada
//                         → rechazada → (borrador, para corregir)
const TRANSICIONES: Record<EstadoRendicion, EstadoRendicion[]> = {
  borrador: ['presentada'],
  presentada: ['aprobada', 'rechazada'],
  aprobada: ['liquidada'],
  rechazada: ['borrador'],
  liquidada: [],
}

/** True si se puede pasar de `actual` a `siguiente`. */
export function transicionValida(actual: EstadoRendicion, siguiente: EstadoRendicion): boolean {
  return TRANSICIONES[actual]?.includes(siguiente) ?? false
}

/** Los ítems solo se pueden editar mientras la rendición está en borrador. */
export function puedeEditarItems(estado: EstadoRendicion): boolean {
  return estado === 'borrador'
}
