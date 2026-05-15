'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar, User } from 'lucide-react'
import type { ProyectoConRelaciones } from '../lib/tipos'
import { ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS } from '../lib/tipos'

interface Props {
  proyectos: ProyectoConRelaciones[]
}

export function TabProyectosPersona({ proyectos }: Props) {
  if (proyectos.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">Esta persona no participa en ningún proyecto.</p>
  }

  return (
    <div className="space-y-2">
      {proyectos.map(p => (
        <Link key={p.id} href={`/admin/proyectos/${p.id}`}>
          <div className="border rounded-lg p-3 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-medium">{p.nombre}</span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{ borderColor: ESTADO_PROYECTO_COLORS[p.estado], color: ESTADO_PROYECTO_COLORS[p.estado] }}
              >
                {ESTADO_PROYECTO_LABELS[p.estado]}
              </Badge>
            </div>
            {p.fecha_fin_estimada && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Vence: {new Date(p.fecha_fin_estimada).toLocaleDateString('es-AR')}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
