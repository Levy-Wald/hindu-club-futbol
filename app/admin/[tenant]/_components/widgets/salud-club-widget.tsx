'use client'

import { useEffect, useState } from 'react'
import { WidgetBase } from '../widget-base'

export function SaludClubWidget() {
  const [lesionados, setLesionados] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/salud-club')
      .then(r => r.json())
      .then(d => setLesionados(d.data?.lesionados_activos ?? 0))
      .catch(() => setLesionados(0))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetBase
      title="Salud del club"
      loading={loading}
      empty={lesionados === 0}
      emptyMessage="Sin lesionados activos. Plantel completo."
      href="/admin/salud"
    >
      {lesionados > 0 && (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-amber-600">{lesionados}</p>
          <p className="text-xs text-muted-foreground">
            jugador{lesionados !== 1 ? 'es' : ''} lesionado{lesionados !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </WidgetBase>
  )
}
