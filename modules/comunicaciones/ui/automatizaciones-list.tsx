'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Zap } from 'lucide-react'
import {
  toggleActivoAutomatizacion,
  softDeleteAutomatizacion,
} from '@/modules/comunicaciones/lib/actions'

interface Automatizacion {
  id: string
  nombre: string
  slug: string
  trigger_evento: string
  descripcion: string | null
  activo: boolean
  created_at: string
}

interface AutomatizacionesListProps {
  automatizaciones: Automatizacion[]
  puedeEditar: boolean
}

const TRIGGER_LABELS: Record<string, string> = {
  persona_creada: 'Persona creada',
  cuota_emitida: 'Cuota emitida',
  cuota_vencida: 'Cuota vencida',
  evento_confirmado: 'Evento confirmado',
  equipo_inscripcion: 'Inscripcion a equipo',
  apto_vence_7d: 'Apto medico vence en 7 dias',
  cuota_vence_7d: 'Cuota vence en 7 dias',
  cuota_vencida_7d: 'Cuota vencida hace 7 dias',
  manual: 'Manual',
}

export function AutomatizacionesList({ automatizaciones, puedeEditar }: AutomatizacionesListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleActivoAutomatizacion(id)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      const result = await softDeleteAutomatizacion(id)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => router.push('/admin/comunicaciones/automatizaciones/nueva')}
          >
            <Plus className="h-4 w-4" />
            Nueva automatizacion
          </Button>
        </div>
      )}

      {automatizaciones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No hay automatizaciones configuradas
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {automatizaciones.map((auto) => (
            <Card key={auto.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <Zap className={`h-5 w-5 flex-shrink-0 ${auto.activo ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    className="font-medium text-sm hover:underline text-left"
                    onClick={() => router.push(`/admin/comunicaciones/automatizaciones/${auto.id}`)}
                  >
                    {auto.nombre}
                  </button>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">
                      {TRIGGER_LABELS[auto.trigger_evento] ?? auto.trigger_evento}
                    </Badge>
                    {auto.descripcion && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {auto.descripcion}
                      </span>
                    )}
                  </div>
                </div>
                {puedeEditar && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={auto.activo}
                      onCheckedChange={() => handleToggle(auto.id)}
                      disabled={isPending}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => handleDelete(auto.id)}
                      disabled={deletingId === auto.id}
                    >
                      {deletingId === auto.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
