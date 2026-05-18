'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { crearEvaluacion } from '../lib/actions'
import { DIMENSIONES, RECOMENDACIONES } from '../lib/tipos'
import type { DimensionCol } from '../lib/tipos'

interface EvaluacionFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  fichaId: string
}

const COL_MAP: Record<string, DimensionCol> = {
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

const CATEGORIA_LABEL: Record<string, string> = {
  tecnica: 'Técnica',
  fisica: 'Física',
  mental: 'Mental',
  tactica: 'Táctica',
}

const CATEGORIA_COLOR: Record<string, string> = {
  tecnica: 'text-blue-600 dark:text-blue-400',
  fisica: 'text-green-600 dark:text-green-400',
  mental: 'text-purple-600 dark:text-purple-400',
  tactica: 'text-amber-600 dark:text-amber-400',
}

export function EvaluacionForm({ open, onOpenChange, onSuccess, fichaId }: EvaluacionFormProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [contexto, setContexto] = useState('')
  const [scores, setScores] = useState<Record<string, number | undefined>>({})
  const [fortalezas, setFortalezas] = useState('')
  const [debilidades, setDebilidades] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [recomendacion, setRecomendacion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setScore(slug: string, val: number) {
    setScores(prev => ({ ...prev, [slug]: val }))
  }

  async function handleSubmit() {
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      ficha_id: fichaId,
      fecha_evaluacion: fecha,
      contexto: contexto || undefined,
      fortalezas: fortalezas || undefined,
      debilidades: debilidades || undefined,
      observaciones_generales: observaciones || undefined,
      recomendacion: recomendacion || undefined,
    }

    for (const dim of DIMENSIONES) {
      const col = COL_MAP[dim.slug]
      if (col && scores[dim.slug]) {
        payload[col] = scores[dim.slug]
      }
    }

    const res = await crearEvaluacion(payload as any)
    setSubmitting(false)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success('Evaluación registrada')
    onOpenChange(false)
    onSuccess()
  }

  // Group dimensions by category
  const grouped = DIMENSIONES.reduce((acc, d) => {
    if (!acc[d.categoria]) acc[d.categoria] = []
    acc[d.categoria].push(d)
    return acc
  }, {} as Record<string, typeof DIMENSIONES[number][]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva evaluación</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contexto</Label>
              <Input value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Ej: Partido vs Club X" />
            </div>
          </div>

          {Object.entries(grouped).map(([cat, dims]) => (
            <div key={cat} className="space-y-3">
              <h4 className={`text-sm font-semibold ${CATEGORIA_COLOR[cat]}`}>
                {CATEGORIA_LABEL[cat]}
              </h4>
              <div className="space-y-3">
                {dims.map(d => {
                  const val = scores[d.slug]
                  return (
                    <div key={d.slug} className="grid grid-cols-[140px_1fr_40px] items-center gap-3">
                      <Label className="text-xs truncate" title={d.nombre}>{d.nombre}</Label>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={val ? [val] : [5]}
                        onValueChange={(v) => { const arr = Array.isArray(v) ? v : [v]; setScore(d.slug, arr[0]) }}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-center tabular-nums">
                        {val ?? '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label>Recomendación</Label>
            <Select value={recomendacion} onValueChange={(v) => setRecomendacion(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {RECOMENDACIONES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fortalezas</Label>
              <Textarea value={fortalezas} onChange={e => setFortalezas(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Debilidades</Label>
              <Textarea value={debilidades} onChange={e => setDebilidades(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observaciones generales</Label>
            <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !fecha}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Registrar evaluación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
