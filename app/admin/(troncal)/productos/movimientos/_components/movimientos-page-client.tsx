'use client'

import { Badge } from '@/components/ui/badge'
import type { MovimientoStock, TipoMovimiento } from '@/modules/pim/lib/tipos'

const TIPO_LABELS: Record<TipoMovimiento, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  transferencia: 'Transferencia',
  ajuste: 'Ajuste',
}

const TIPO_COLORS: Record<TipoMovimiento, string> = {
  entrada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  salida: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  transferencia: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ajuste: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
}

interface Props {
  movimientos: MovimientoStock[]
}

export function MovimientosPageClient({ movimientos }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Movimientos de Stock</h1>

      {movimientos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No hay movimientos registrados.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {movimientos.map((m) => (
            <div key={m.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${TIPO_COLORS[m.tipo]}`}>
                    {TIPO_LABELS[m.tipo]}
                  </Badge>
                  <span className="font-medium text-sm truncate">{m.producto_nombre}</span>
                  {m.variante_nombre && (
                    <Badge variant="outline" className="text-xs">{m.variante_nombre}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {m.espacio_origen_nombre && <span>De: {m.espacio_origen_nombre}</span>}
                  {m.espacio_destino_nombre && <span>A: {m.espacio_destino_nombre}</span>}
                  {m.motivo && <span>· {m.motivo}</span>}
                  {m.realizado_por_nombre && <span>· {m.realizado_por_nombre}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-lg font-semibold">
                  {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
