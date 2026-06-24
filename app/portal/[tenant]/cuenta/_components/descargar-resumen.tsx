'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToCSV } from '@/lib/export/formats'
import type { CuotaSocio, MovimientoSocio } from '../_lib/queries'

export function DescargarResumen({ cuotas, movimientos }: { cuotas: CuotaSocio[]; movimientos: MovimientoSocio[] }) {
  function descargar() {
    const rows: string[][] = [
      ...cuotas.map((c) => [
        'Cuota',
        c.periodo ?? '',
        String(c.monto_final),
        c.moneda,
        c.estado,
        c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-AR') : '',
      ]),
      ...movimientos.map((m) => [
        'Movimiento',
        m.descripcion ?? m.tipo,
        String(m.monto_neto),
        m.moneda,
        '',
        new Date(m.fecha).toLocaleDateString('es-AR'),
      ]),
    ]
    exportToCSV({
      headers: ['Tipo', 'Detalle', 'Monto', 'Moneda', 'Estado', 'Fecha'],
      rows,
      filename: `mi-resumen-${new Date().toISOString().slice(0, 10)}.csv`,
    })
  }

  const vacio = cuotas.length === 0 && movimientos.length === 0

  return (
    <Button variant="outline" size="sm" onClick={descargar} disabled={vacio}>
      <Download className="h-4 w-4 mr-1" />
      Descargar
    </Button>
  )
}
