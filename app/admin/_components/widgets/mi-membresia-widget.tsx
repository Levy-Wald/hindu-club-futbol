'use client'

import { useEffect, useState } from 'react'
import { usePersonaId } from '@/lib/permissions/capabilities-context'
import { WidgetBase } from '../widget-base'
import { Badge } from '@/components/ui/badge'

interface MembresiaData {
  plan_nombre: string | null
  estado: string
  proxima_cuota_fecha: string | null
  proxima_cuota_monto: number | null
}

export function MiMembresiaWidget() {
  const personaId = usePersonaId()
  const [data, setData] = useState<MembresiaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!personaId) {
      setLoading(false)
      return
    }
    fetch(`/api/dashboard/mi-membresia?personaId=${personaId}`)
      .then(r => r.json())
      .then(d => setData(d.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [personaId])

  return (
    <WidgetBase
      title="Mi membresía"
      loading={loading}
      empty={!data}
      emptyMessage="No tenés una membresía activa."
      href={personaId ? `/admin/personas/${personaId}?tab=suscripciones` : undefined}
    >
      {data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{data.plan_nombre ?? 'Membresía'}</span>
            <Badge
              variant={data.estado === 'activo' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {data.estado}
            </Badge>
          </div>
          {data.proxima_cuota_fecha && (
            <p className="text-xs text-muted-foreground">
              Próxima cuota:{' '}
              {new Date(data.proxima_cuota_fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
              })}
              {data.proxima_cuota_monto != null &&
                ` — $${data.proxima_cuota_monto.toLocaleString('es-AR')}`}
            </p>
          )}
        </div>
      )}
    </WidgetBase>
  )
}
