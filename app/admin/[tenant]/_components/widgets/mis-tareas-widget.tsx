'use client'

import { useEffect, useState } from 'react'
import { usePersonaId } from '@/lib/permissions/capabilities-context'
import { WidgetBase } from '../widget-base'
import { CheckSquare } from 'lucide-react'

interface Tarea {
  id: string
  titulo: string
  estado: string
}

export function MisTareasWidget() {
  const personaId = usePersonaId()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!personaId) {
      setLoading(false)
      return
    }
    fetch(`/api/dashboard/mis-tareas?personaId=${personaId}`)
      .then(r => r.json())
      .then(d => setTareas(d.data ?? []))
      .catch(() => setTareas([]))
      .finally(() => setLoading(false))
  }, [personaId])

  return (
    <WidgetBase
      title="Mis tareas"
      loading={loading}
      empty={tareas.length === 0}
      emptyMessage="No tenés tareas pendientes."
      href="/admin/proyectos"
    >
      <div className="space-y-2">
        {tareas.slice(0, 5).map(t => (
          <div key={t.id} className="flex items-center gap-2 text-sm">
            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{t.titulo}</span>
          </div>
        ))}
        {tareas.length > 5 && (
          <p className="text-xs text-muted-foreground">
            +{tareas.length - 5} más
          </p>
        )}
      </div>
    </WidgetBase>
  )
}
