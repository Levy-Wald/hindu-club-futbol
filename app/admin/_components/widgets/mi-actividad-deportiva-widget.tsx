'use client'

import { useEffect, useState } from 'react'
import { usePersonaId } from '@/lib/permissions/capabilities-context'
import { WidgetBase } from '../widget-base'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

interface EquipoData {
  equipo_nombre: string
  categoria_nombre: string | null
  rol: string
}

export function MiActividadDeportivaWidget() {
  const personaId = usePersonaId()
  const [equipos, setEquipos] = useState<EquipoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!personaId) {
      setLoading(false)
      return
    }
    fetch(`/api/dashboard/mi-actividad?personaId=${personaId}`)
      .then(r => r.json())
      .then(d => setEquipos(d.data ?? []))
      .catch(() => setEquipos([]))
      .finally(() => setLoading(false))
  }, [personaId])

  return (
    <WidgetBase
      title="Mi actividad deportiva"
      loading={loading}
      empty={equipos.length === 0}
      emptyMessage="No estás en ningún equipo actualmente."
      href="/admin/mi-equipo"
    >
      <div className="space-y-2">
        {equipos.map((eq, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">{eq.equipo_nombre}</span>
            {eq.categoria_nombre && (
              <span className="text-xs text-muted-foreground">{eq.categoria_nombre}</span>
            )}
            <Badge variant="outline" className="text-[10px] ml-auto">
              {eq.rol}
            </Badge>
          </div>
        ))}
      </div>
    </WidgetBase>
  )
}
