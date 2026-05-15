'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Plus, Calendar, User, Clock } from 'lucide-react'
import { TareaModal } from './tarea-modal'
import type { TareaConRelaciones, EstadoTareaCatalogo } from '../lib/tipos'
import { PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '../lib/tipos'

interface Props {
  proyectoId: string
  tareas: TareaConRelaciones[]
  estados: EstadoTareaCatalogo[]
  miembros?: { id: string; nombre: string; apellido: string }[]
}

export function ListaTareas({ proyectoId, tareas, estados, miembros = [] }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('')
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTarea, setEditingTarea] = useState<TareaConRelaciones | null>(null)

  const filtered = tareas.filter(t => {
    if (filtroEstado && t.estado_slug !== filtroEstado) return false
    if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false
    if (busqueda && !t.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const estadoMap = new Map(estados.map(e => [e.slug, e]))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          placeholder="Buscar tarea..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filtroEstado} onValueChange={v => setFiltroEstado(v ?? '')}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {estados.map(e => (
              <SelectItem key={e.slug} value={e.slug}>{e.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroPrioridad} onValueChange={v => setFiltroPrioridad(v ?? '')}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Prioridad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {Object.entries(PRIORIDAD_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setEditingTarea(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva tarea
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Título</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Estado</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Prioridad</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Asignado</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Fecha límite</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Horas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const estado = estadoMap.get(t.estado_slug)
              return (
                <tr
                  key={t.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => { setEditingTarea(t); setModalOpen(true) }}
                >
                  <td className="p-3">
                    <p className="font-medium truncate max-w-[300px]">{t.titulo}</p>
                    <div className="flex items-center gap-2 sm:hidden mt-1">
                      {estado && (
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: estado.color ?? undefined }}>
                          {estado.nombre}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: PRIORIDAD_COLORS[t.prioridad] }}>
                        {PRIORIDAD_LABELS[t.prioridad]}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    {estado && (
                      <Badge variant="outline" style={{ borderColor: estado.color ?? undefined, color: estado.color ?? undefined }}>
                        {estado.nombre}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <Badge variant="outline" style={{ borderColor: PRIORIDAD_COLORS[t.prioridad], color: PRIORIDAD_COLORS[t.prioridad] }}>
                      {PRIORIDAD_LABELS[t.prioridad]}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {t.asignado ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {t.asignado.apellido}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {t.fecha_limite ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(t.fecha_limite).toLocaleDateString('es-AR')}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    {t.tiempo_estimado_horas ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {t.tiempo_real_horas ?? 0}/{t.tiempo_estimado_horas}h
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin tareas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TareaModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setEditingTarea(null) }}
        proyectoId={proyectoId}
        tarea={editingTarea}
        estados={estados}
        miembros={miembros}
      />
    </>
  )
}
