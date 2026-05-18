'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity, Plus, Loader2, CheckCircle, Trash2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { marcarRecuperada, softDeleteLesion } from '../lib/actions'
import { LesionForm } from './lesion-form'
import type { TipoLesion } from '../lib/tipos'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface LesionListProps {
  personaId: string
  tiposLesion: TipoLesion[]
  equipos: { id: string; nombre: string }[]
}

interface LesionData {
  id: string
  tipo_lesion: string | null
  tipo_lesion_slug: string | null
  zona_corporal: string | null
  gravedad: string | null
  fecha_inicio: string | null
  fecha_alta_medica: string | null
  recuperada: boolean
  activo: boolean
  restriccion_actividad: string | null
  diagnostico_medico: string | null
  tratamiento: string | null
  descripcion: string | null
  notas: string | null
  equipo_id: string | null
  tipos_lesion: { nombre: string } | null
  equipos: { nombre: string } | null
}

export function LesionList({ personaId, tiposLesion, equipos }: LesionListProps) {
  const [lesiones, setLesiones] = useState<LesionData[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<LesionData | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('personas_lesiones')
      .select('*, tipos_lesion:tipo_lesion_slug(nombre), equipos:equipo_id(nombre)')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', personaId)
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: false })
    setLesiones(data ?? [])
    setLoading(false)
  }, [personaId])

  useEffect(() => { cargar() }, [cargar])

  const [recuperarId, setRecuperarId] = useState<string | null>(null)
  const [fechaAlta, setFechaAlta] = useState(new Date().toISOString().slice(0, 10))

  async function handleRecuperar(id: string) {
    const res = await marcarRecuperada(id, fechaAlta)
    if (res.ok) { toast.success('Marcada como recuperada'); setRecuperarId(null); cargar() }
    else toast.error(res.error ?? 'Error')
  }

  async function handleEliminar(id: string) {
    const res = await softDeleteLesion(id)
    if (res.ok) { toast.success('Lesión eliminada'); cargar() }
    else toast.error(res.error ?? 'Error')
  }

  function handleEditar(lesion: LesionData) {
    setEditData(lesion)
    setFormOpen(true)
  }

  const activas = lesiones.filter(l => !l.recuperada)
  const historicas = lesiones.filter(l => l.recuperada)

  const gravedadColor = (g: string | null) => {
    if (g === 'leve') return 'secondary'
    if (g === 'moderada') return 'default'
    if (g === 'grave') return 'destructive'
    if (g === 'muy_grave') return 'destructive'
    return 'outline'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Lesiones ({lesiones.length})
          </CardTitle>
          <Button size="sm" onClick={() => { setEditData(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Registrar lesión
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : lesiones.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sin lesiones registradas</p>
        ) : (
          <div className="space-y-6">
            {activas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-destructive">Activas ({activas.length})</h3>
                {activas.map(l => (
                  <LesionCard key={l.id} lesion={l} gravedadColor={gravedadColor}
                    onRecuperar={() => { setFechaAlta(new Date().toISOString().slice(0, 10)); setRecuperarId(l.id) }}
                    onEliminar={() => handleEliminar(l.id)}
                    onEditar={() => handleEditar(l)} />
                ))}
              </div>
            )}
            {historicas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Historial ({historicas.length})</h3>
                {historicas.map(l => (
                  <LesionCard key={l.id} lesion={l} gravedadColor={gravedadColor}
                    onEliminar={() => handleEliminar(l.id)}
                    onEditar={() => handleEditar(l)} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog confirmar recuperación */}
      <Dialog open={!!recuperarId} onOpenChange={(v) => { if (!v) setRecuperarId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como recuperada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Fecha de alta médica</Label>
              <Input type="date" value={fechaAlta} onChange={e => setFechaAlta(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecuperarId(null)}>Cancelar</Button>
            <Button onClick={() => recuperarId && handleRecuperar(recuperarId)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" /> Confirmar recuperación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LesionForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditData(null) }}
        onSuccess={cargar}
        personaId={personaId}
        tiposLesion={tiposLesion}
        equipos={equipos}
        editData={editData ? {
          id: editData.id,
          tipo_lesion_slug: editData.tipo_lesion_slug,
          zona_corporal: editData.zona_corporal,
          gravedad: editData.gravedad,
          fecha_inicio: editData.fecha_inicio,
          equipo_id: editData.equipo_id,
          restriccion_actividad: editData.restriccion_actividad,
          diagnostico_medico: editData.diagnostico_medico,
          tratamiento: editData.tratamiento,
          descripcion: editData.descripcion,
          notas: editData.notas,
        } : undefined}
      />
    </Card>
  )
}

function LesionCard({ lesion, gravedadColor, onRecuperar, onEliminar, onEditar }: {
  lesion: LesionData
  gravedadColor: (g: string | null) => string
  onRecuperar?: () => void
  onEliminar: () => void
  onEditar: () => void
}) {
  const tipoNombre = (lesion.tipos_lesion as any)?.nombre ?? lesion.tipo_lesion ?? 'Sin tipo'
  const equipoNombre = (lesion.equipos as any)?.nombre ?? null

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{tipoNombre}</span>
            <Badge variant={gravedadColor(lesion.gravedad) as any}>
              {lesion.gravedad ?? 'sin gravedad'}
            </Badge>
            {!lesion.recuperada && (
              <Badge variant="destructive">activa</Badge>
            )}
            {lesion.recuperada && (
              <Badge variant="outline">recuperada</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {lesion.zona_corporal && <span>Zona: {lesion.zona_corporal}</span>}
            {lesion.fecha_inicio && <span>Desde: {lesion.fecha_inicio}</span>}
            {lesion.fecha_alta_medica && <span>Alta: {lesion.fecha_alta_medica}</span>}
            {equipoNombre && <span>Equipo: {equipoNombre}</span>}
          </div>
          {lesion.restriccion_actividad && (
            <p className="text-xs text-destructive">Restricción: {lesion.restriccion_actividad}</p>
          )}
          {lesion.diagnostico_medico && (
            <p className="text-xs">Diagnóstico: {lesion.diagnostico_medico}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditar} title="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onEliminar} title="Eliminar">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {onRecuperar && !lesion.recuperada && (
        <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 w-full" onClick={onRecuperar}>
          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Marcar como recuperada
        </Button>
      )}
    </div>
  )
}
