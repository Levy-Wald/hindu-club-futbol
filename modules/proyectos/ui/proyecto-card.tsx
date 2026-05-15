'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, User, CheckCircle2 } from 'lucide-react'
import type { ProyectoConRelaciones } from '../lib/tipos'
import { ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS } from '../lib/tipos'

interface Props {
  proyecto: ProyectoConRelaciones
}

export function ProyectoCard({ proyecto }: Props) {
  const progress = proyecto.total_tareas
    ? Math.round(((proyecto.tareas_completadas ?? 0) / proyecto.total_tareas) * 100)
    : 0

  return (
    <Link href={`/admin/proyectos/${proyecto.id}`}>
      <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proyecto.color }} />
            <h3 className="font-medium text-sm truncate">{proyecto.nombre}</h3>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] shrink-0"
            style={{ borderColor: ESTADO_PROYECTO_COLORS[proyecto.estado], color: ESTADO_PROYECTO_COLORS[proyecto.estado] }}
          >
            {ESTADO_PROYECTO_LABELS[proyecto.estado]}
          </Badge>
        </div>

        {proyecto.descripcion && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proyecto.descripcion}</p>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          {proyecto.responsable && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {proyecto.responsable.apellido}
            </span>
          )}
          {proyecto.fecha_fin_estimada && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(proyecto.fecha_fin_estimada).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {(proyecto.total_tareas ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {proyecto.tareas_completadas ?? 0}/{proyecto.total_tareas}
            </span>
          )}
        </div>

        {(proyecto.total_tareas ?? 0) > 0 && (
          <div className="mt-2">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {proyecto.presupuesto_total && (
          <div className="mt-2 text-xs text-muted-foreground">
            Presupuesto: ${proyecto.presupuesto_consumido?.toLocaleString('es-AR') ?? '0'} / ${proyecto.presupuesto_total.toLocaleString('es-AR')} {proyecto.moneda}
          </div>
        )}
      </div>
    </Link>
  )
}
