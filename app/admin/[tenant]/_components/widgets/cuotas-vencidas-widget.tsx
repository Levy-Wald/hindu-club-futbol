'use client'

import { useEffect, useState } from 'react'
import { WidgetBase } from '../widget-base'

interface CuotasData {
  total_vencidas: number
  total_deudores: number
  monto_total: number
}

export function CuotasVencidasWidget() {
  const [data, setData] = useState<CuotasData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/cuotas-vencidas')
      .then(r => r.json())
      .then(d => setData(d.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetBase
      title="Cuotas vencidas"
      loading={loading}
      empty={!data || data.total_vencidas === 0}
      emptyMessage="Sin cuotas vencidas. Cobranza al día."
      href="/admin/finanzas/cuotas"
    >
      {data && data.total_vencidas > 0 && (
        <div className="space-y-1">
          <p className="text-2xl font-bold">{data.total_vencidas}</p>
          <p className="text-xs text-muted-foreground">
            {data.total_deudores} deudor{data.total_deudores !== 1 ? 'es' : ''} — $
            {data.monto_total.toLocaleString('es-AR')}
          </p>
        </div>
      )}
    </WidgetBase>
  )
}
