'use client'

import { Badge } from '@/components/ui/badge'
import type { LesionadoActivo } from '../lib/tipos'

interface LesionTimelineProps {
  lesionados: LesionadoActivo[]
}

export function LesionTimeline({ lesionados }: LesionTimelineProps) {
  if (lesionados.length === 0) {
    return <p className="text-center text-muted-foreground py-4 text-sm">Sin lesionados activos</p>
  }

  return (
    <div className="space-y-2">
      {lesionados.map(l => (
        <div key={l.id} className="flex items-start gap-3 p-2 rounded-md border text-sm">
          <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{l.persona_nombre}</p>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span>{l.tipo_lesion_nombre ?? l.tipo_lesion ?? 'Sin tipo'}</span>
              {l.zona_corporal && <span>· {l.zona_corporal}</span>}
              {l.dias_inactivo != null && <span>· {l.dias_inactivo}d inactivo</span>}
            </div>
          </div>
          <Badge variant="destructive" className="shrink-0 text-[10px]">
            {l.gravedad ?? '?'}
          </Badge>
        </div>
      ))}
    </div>
  )
}
