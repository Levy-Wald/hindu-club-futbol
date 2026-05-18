'use client'

import { useEffect, useState } from 'react'
import { WidgetBase } from '../widget-base'

interface ComData {
  total_enviados: number
  ultimo_envio: string | null
}

export function ComunicacionesWidget() {
  const [data, setData] = useState<ComData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/comunicaciones')
      .then(r => r.json())
      .then(d => setData(d.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetBase
      title="Comunicaciones"
      loading={loading}
      empty={!data || data.total_enviados === 0}
      emptyMessage="Sin envíos recientes."
      href="/admin/comunicaciones"
    >
      {data && data.total_enviados > 0 && (
        <div className="space-y-1">
          <p className="text-2xl font-bold">{data.total_enviados}</p>
          <p className="text-xs text-muted-foreground">
            envíos este mes
            {data.ultimo_envio &&
              ` — último: ${new Date(data.ultimo_envio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`}
          </p>
        </div>
      )}
    </WidgetBase>
  )
}
