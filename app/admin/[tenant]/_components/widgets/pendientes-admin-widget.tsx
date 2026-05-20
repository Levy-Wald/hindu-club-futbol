'use client'

import { useEffect, useState } from 'react'
import { WidgetBase } from '../widget-base'
import { Users, AlertCircle } from 'lucide-react'

interface PendientesData {
  pre_inscripciones_pendientes: number
  cuotas_vencidas: number
}

export function PendientesAdminWidget() {
  const [data, setData] = useState<PendientesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/pendientes-admin')
      .then(r => r.json())
      .then(d => setData(d.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const total = data ? data.pre_inscripciones_pendientes + data.cuotas_vencidas : 0

  return (
    <WidgetBase
      title="Pendientes admin"
      loading={loading}
      empty={total === 0}
      emptyMessage="No hay pendientes. Todo en orden."
    >
      {data && (
        <div className="space-y-2">
          {data.pre_inscripciones_pendientes > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-amber-500" />
              <span>{data.pre_inscripciones_pendientes} pre-inscripciones pendientes</span>
            </div>
          )}
          {data.cuotas_vencidas > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>{data.cuotas_vencidas} cuotas vencidas</span>
            </div>
          )}
        </div>
      )}
    </WidgetBase>
  )
}
