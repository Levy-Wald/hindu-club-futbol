'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, ClipboardCheck, UserPlus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { softDeleteEvaluacion, promoverFichaAPersona } from '../lib/actions'
import { EvaluacionForm } from './evaluacion-form'
import { EvaluacionRadarChart } from './evaluacion-radar-chart'
import { DIMENSIONES, RECOMENDACIONES } from '../lib/tipos'
import type { Evaluacion, DimensionCol } from '../lib/tipos'

interface EvaluacionesPanelProps {
  fichaId: string
  evaluacionesInicial: Evaluacion[]
  fichaPersonaId: string | null
  fichaEstado: string
}

const SLUG_TO_COL: Record<string, DimensionCol> = {
  'control_balon': 'control_balon',
  'pase': 'pase',
  'definicion': 'definicion',
  '1vs1': 'uno_vs_uno',
  'velocidad': 'velocidad',
  'resistencia': 'resistencia',
  'fuerza': 'fuerza',
  'mentalidad': 'mentalidad',
  'competitividad': 'competitividad',
  'vision_juego': 'vision_juego',
  'posicionamiento': 'posicionamiento',
}

const REC_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  contratar_ya: 'default',
  seguir_observando: 'secondary',
  no_apto: 'destructive',
  volver_evaluar: 'outline',
}

export function EvaluacionesPanel({ fichaId, evaluacionesInicial, fichaPersonaId, fichaEstado }: EvaluacionesPanelProps) {
  const router = useRouter()
  const [evaluaciones, setEvaluaciones] = useState(evaluacionesInicial)
  const [formOpen, setFormOpen] = useState(false)
  const [promoverOpen, setPromoverOpen] = useState(false)
  const [promoviendo, setPromoviendo] = useState(false)

  function handleSuccess() {
    router.refresh()
  }

  async function handleDelete(id: string) {
    const res = await softDeleteEvaluacion(id, fichaId)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success('Evaluación eliminada')
    setEvaluaciones(prev => prev.filter(e => e.id !== id))
  }

  async function handlePromover() {
    setPromoviendo(true)
    const res = await promoverFichaAPersona(fichaId)
    setPromoviendo(false)
    setPromoverOpen(false)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success('Jugador incorporado como persona')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Evaluaciones ({evaluaciones.length})
        </h3>
        <div className="flex gap-2">
          {!fichaPersonaId && fichaEstado !== 'incorporado' && (
            <Button size="sm" variant="outline" onClick={() => setPromoverOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Convertir en jugador
            </Button>
          )}
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva evaluación
          </Button>
        </div>
      </div>

      {/* Radar chart */}
      <EvaluacionRadarChart evaluaciones={evaluaciones} />

      {/* Evaluaciones list */}
      {evaluaciones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Sin evaluaciones. Agregá la primera para ver el radar de habilidades.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evaluaciones.map(ev => (
            <EvaluacionCard key={ev.id} evaluacion={ev} onDelete={() => handleDelete(ev.id)} />
          ))}
        </div>
      )}

      {/* Form modal */}
      <EvaluacionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        fichaId={fichaId}
      />

      {/* Promover dialog */}
      <Dialog open={promoverOpen} onOpenChange={setPromoverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir en jugador</DialogTitle>
            <DialogDescription>
              Se creará una persona en el sistema con los datos de esta ficha de scouting.
              La ficha quedará vinculada como historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoverOpen(false)}>Cancelar</Button>
            <Button onClick={handlePromover} disabled={promoviendo}>
              {promoviendo && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EvaluacionCard({ evaluacion: ev, onDelete }: { evaluacion: Evaluacion; onDelete: () => void }) {
  const recLabel = RECOMENDACIONES.find(r => r.value === ev.recomendacion)?.label

  // Build scored dimensions summary
  const scored = DIMENSIONES
    .map(d => {
      const col = SLUG_TO_COL[d.slug]
      const val = ev[col] as number | null
      return val != null ? { nombre: d.nombre, val } : null
    })
    .filter(Boolean) as { nombre: string; val: number }[]

  const avg = scored.length > 0
    ? (scored.reduce((a, s) => a + s.val, 0) / scored.length).toFixed(1)
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">
              {new Date(ev.fecha_evaluacion).toLocaleDateString('es-AR')}
              {ev.contexto && <span className="font-normal text-muted-foreground"> — {ev.contexto}</span>}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {avg && <Badge variant="secondary">Prom. {avg}</Badge>}
              {recLabel && <Badge variant={REC_VARIANT[ev.recomendacion!] ?? 'outline'}>{recLabel}</Badge>}
              {ev.scout_nombre && <span className="text-xs text-muted-foreground">Scout: {ev.scout_nombre}</span>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Score grid */}
        {scored.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {scored.map(s => (
              <div key={s.nombre} className="text-center">
                <p className="text-lg font-bold">{s.val}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.nombre}</p>
              </div>
            ))}
          </div>
        )}

        {/* Qualitative */}
        {(ev.fortalezas || ev.debilidades || ev.observaciones_generales) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t">
            {ev.fortalezas && (
              <div>
                <p className="font-medium text-green-600 dark:text-green-400">Fortalezas</p>
                <p className="text-muted-foreground">{ev.fortalezas}</p>
              </div>
            )}
            {ev.debilidades && (
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Debilidades</p>
                <p className="text-muted-foreground">{ev.debilidades}</p>
              </div>
            )}
            {ev.observaciones_generales && (
              <div>
                <p className="font-medium">Observaciones</p>
                <p className="text-muted-foreground">{ev.observaciones_generales}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
