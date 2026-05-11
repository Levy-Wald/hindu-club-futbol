'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Loader2, Plus, Search, CheckCircle, Truck, RotateCcw, AlertTriangle, X, Package,
} from 'lucide-react'
import type { PermisosUtileria } from '@/lib/permisos/utileria'
import {
  listarSolicitudes, crearSolicitud, marcarComoPreparada, registrarEntrega,
  registrarDevolucion, cerrarConCargo, cancelarSolicitud, listarItems, fetchEquiposUtileria,
} from '../_actions'

interface Equipo { id: string; nombre: string }

const ESTADO_LABELS: Record<string, string> = {
  solicitada: 'Solicitada',
  preparada: 'Preparada',
  entregada: 'Entregada',
  devolucion_parcial: 'Dev. parcial',
  devuelta: 'Devuelta',
  cerrada_con_cargo: 'Con cargo',
  cancelada: 'Cancelada',
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  solicitada: 'secondary',
  preparada: 'default',
  entregada: 'default',
  devolucion_parcial: 'destructive',
  devuelta: 'outline',
  cerrada_con_cargo: 'destructive',
  cancelada: 'outline',
}

export function SolicitudesClient({ permisos }: { permisos: PermisosUtileria }) {
  const [solicitudes, setSolicitudes] = useState<Record<string, unknown>[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [equipoFiltro, setEquipoFiltro] = useState('')

  // New solicitud
  const [crearOpen, setCrearOpen] = useState(false)
  const [allItems, setAllItems] = useState<Record<string, unknown>[]>([])
  const [saving, setSaving] = useState(false)
  const [newSol, setNewSol] = useState({ equipo_id: '', descripcion_evento: '', fecha_evento: '', notas_solicitud: '' })
  const [newItems, setNewItems] = useState<{ item_id: string; cantidad: number; nombre: string }[]>([])
  const [addItemId, setAddItemId] = useState('')
  const [addCantidad, setAddCantidad] = useState(1)

  // Detail/action dialog
  const [detalle, setDetalle] = useState<Record<string, unknown> | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await listarSolicitudes({
      estado: estadoFiltro || undefined,
      equipo_id: equipoFiltro || undefined,
    })
    if (res.ok) setSolicitudes(res.data as Record<string, unknown>[])
    else toast.error(res.message)
    setLoading(false)
  }, [estadoFiltro, equipoFiltro])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { fetchEquiposUtileria().then(setEquipos) }, [])

  const openCrear = async () => {
    setNewSol({ equipo_id: '', descripcion_evento: '', fecha_evento: '', notas_solicitud: '' })
    setNewItems([])
    if (allItems.length === 0) {
      const res = await listarItems({ solo_disponibles: true })
      if (res.ok) setAllItems(res.data as Record<string, unknown>[])
    }
    setCrearOpen(true)
  }

  const handleAddItemToSol = () => {
    if (!addItemId) return
    const item = allItems.find(i => i.id === addItemId)
    if (!item) return
    if (newItems.some(ni => ni.item_id === addItemId)) return toast.error('Item ya agregado')
    setNewItems(prev => [...prev, { item_id: addItemId, cantidad: addCantidad, nombre: item.nombre as string }])
    setAddItemId('')
    setAddCantidad(1)
  }

  const handleCrear = async () => {
    if (!newSol.equipo_id || !newSol.descripcion_evento || !newSol.fecha_evento || newItems.length === 0) {
      return toast.error('Completar equipo, evento, fecha y al menos 1 item')
    }
    setSaving(true)
    const res = await crearSolicitud({
      ...newSol,
      items: newItems.map(i => ({ item_id: i.item_id, cantidad: i.cantidad })),
    })
    if (res.ok) { toast.success(res.message); setCrearOpen(false); cargar() }
    else toast.error(res.message)
    setSaving(false)
  }

  // Actions on solicitud
  const handlePreparar = async (sol: Record<string, unknown>) => {
    setActionLoading(true)
    const solItems = (sol.utileria_solicitud_items ?? []) as Record<string, unknown>[]
    const items = solItems.map(si => ({
      item_id: si.item_id as string,
      cantidad: si.cantidad_solicitada as number,
    }))
    const res = await marcarComoPreparada(sol.id as string, items)
    if (res.ok) { toast.success(res.message); setDetalle(null); cargar() }
    else toast.error(res.message)
    setActionLoading(false)
  }

  const handleEntregar = async (sol: Record<string, unknown>) => {
    setActionLoading(true)
    const solItems = (sol.utileria_solicitud_items ?? []) as Record<string, unknown>[]
    const items = solItems.map(si => ({
      item_id: si.item_id as string,
      cantidad: si.cantidad_preparada as number || si.cantidad_solicitada as number,
    }))
    const solicitante = sol.solicitante as Record<string, unknown> | Record<string, unknown>[] | null
    const solicitanteId = Array.isArray(solicitante) ? (solicitante[0] as Record<string, unknown>)?.id : (solicitante as Record<string, unknown>)?.id
    const res = await registrarEntrega(sol.id as string, solicitanteId as string, items)
    if (res.ok) { toast.success(res.message); setDetalle(null); cargar() }
    else toast.error(res.message)
    setActionLoading(false)
  }

  const handleDevolucion = async (sol: Record<string, unknown>) => {
    setActionLoading(true)
    const solItems = (sol.utileria_solicitud_items ?? []) as Record<string, unknown>[]
    // For simplicity: mark all as fully returned. In production, a sub-dialog per item would be better.
    const items = solItems.map(si => ({
      item_id: si.item_id as string,
      cantidad_devuelta: si.cantidad_entregada as number,
    }))
    const res = await registrarDevolucion(sol.id as string, items)
    if (res.ok) { toast.success(res.message); setDetalle(null); cargar() }
    else toast.error(res.message)
    setActionLoading(false)
  }

  const handleCerrarCargo = async (solId: string) => {
    if (!confirm('Generar cargos de reposicion prorrateados al plantel?')) return
    setActionLoading(true)
    const res = await cerrarConCargo(solId)
    if (res.ok) { toast.success(res.message); setDetalle(null); cargar() }
    else toast.error(res.message)
    setActionLoading(false)
  }

  const handleCancelar = async (solId: string) => {
    const motivo = prompt('Motivo de cancelacion:')
    if (!motivo) return
    const res = await cancelarSolicitud(solId, motivo)
    if (res.ok) { toast.success(res.message); setDetalle(null); cargar() }
    else toast.error(res.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitudes de Utileria</h1>
        <Button onClick={openCrear}><Plus className="h-4 w-4 mr-1" /> Nueva solicitud</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={estadoFiltro} onValueChange={v => setEstadoFiltro(v ?? '')}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={equipoFiltro} onValueChange={v => setEquipoFiltro(v ?? '')}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Equipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay solicitudes</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-2 font-medium">Evento</th>
                <th className="py-2 px-2 font-medium">Equipo</th>
                <th className="py-2 px-2 font-medium">Fecha</th>
                <th className="py-2 px-2 font-medium">Items</th>
                <th className="py-2 px-2 font-medium">Estado</th>
                <th className="py-2 px-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(sol => {
                const equipo = sol.equipos as Record<string, unknown> | Record<string, unknown>[] | null
                const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
                const solItems = (sol.utileria_solicitud_items ?? []) as Record<string, unknown>[]
                return (
                  <tr key={sol.id as string} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setDetalle(sol)}>
                    <td className="py-2 px-2">{sol.descripcion_evento as string}</td>
                    <td className="py-2 px-2">{equipoNombre as string}</td>
                    <td className="py-2 px-2">{new Date(sol.fecha_evento as string).toLocaleDateString('es-AR')}</td>
                    <td className="py-2 px-2">{solItems.length} items</td>
                    <td className="py-2 px-2">
                      <Badge variant={ESTADO_VARIANT[sol.estado as string] ?? 'secondary'}>
                        {ESTADO_LABELS[sol.estado as string] ?? sol.estado as string}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Button size="sm" variant="ghost">Ver</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear solicitud */}
      <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva solicitud de utileria</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Equipo *</Label>
              <Select value={newSol.equipo_id} onValueChange={v => setNewSol(f => ({ ...f, equipo_id: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Para que evento *</Label><Input value={newSol.descripcion_evento} onChange={e => setNewSol(f => ({ ...f, descripcion_evento: e.target.value }))} placeholder="Entrenamiento martes, Partido vs River..." /></div>
            <div><Label>Fecha del evento *</Label><Input type="datetime-local" value={newSol.fecha_evento} onChange={e => setNewSol(f => ({ ...f, fecha_evento: e.target.value }))} /></div>
            <div><Label>Notas</Label><Textarea value={newSol.notas_solicitud} onChange={e => setNewSol(f => ({ ...f, notas_solicitud: e.target.value }))} rows={2} /></div>

            <div className="border-t pt-3">
              <Label className="mb-2 block">Items solicitados ({newItems.length})</Label>
              {newItems.map((ni, idx) => (
                <div key={ni.item_id} className="flex items-center justify-between text-sm py-1">
                  <span>{ni.nombre} x{ni.cantidad}</span>
                  <Button size="sm" variant="ghost" onClick={() => setNewItems(prev => prev.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Select value={addItemId} onValueChange={v => setAddItemId(v ?? '')}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Agregar item..." /></SelectTrigger>
                  <SelectContent>{allItems.map(i => <SelectItem key={i.id as string} value={i.id as string}>{i.nombre as string} (disp: {i.cantidad_disponible as number})</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" min={1} value={addCantidad} onChange={e => setAddCantidad(parseInt(e.target.value) || 1)} className="w-20" />
                <Button variant="outline" onClick={handleAddItemToSol}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrearOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrear} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Enviar solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal detalle solicitud */}
      <Dialog open={!!detalle} onOpenChange={() => setDetalle(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detalle && (() => {
            const estado = detalle.estado as string
            const solItems = (detalle.utileria_solicitud_items ?? []) as Record<string, unknown>[]
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{detalle.descripcion_evento as string}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant={ESTADO_VARIANT[estado] ?? 'secondary'}>{ESTADO_LABELS[estado] ?? estado}</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(detalle.fecha_evento as string).toLocaleDateString('es-AR')}</span>
                  </div>
                  {!!(detalle.fecha_devolucion_esperada) && (
                    <p className="text-sm">Devolucion esperada: {new Date(detalle.fecha_devolucion_esperada as string).toLocaleDateString('es-AR')}</p>
                  )}

                  <div className="border-t pt-2">
                    <p className="text-sm font-medium mb-2">Items:</p>
                    {solItems.map(si => {
                      const itemData = si.utileria_items as Record<string, unknown> | Record<string, unknown>[] | null
                      const itemNombre = Array.isArray(itemData) ? (itemData[0] as Record<string, unknown>)?.nombre : (itemData as Record<string, unknown>)?.nombre
                      return (
                        <div key={si.id as string} className="flex justify-between text-sm py-1 border-b last:border-0">
                          <span>{itemNombre as string}</span>
                          <span className="text-muted-foreground">
                            Sol: {si.cantidad_solicitada as number}
                            {(si.cantidad_entregada as number) > 0 && ` | Ent: ${si.cantidad_entregada as number}`}
                            {(si.cantidad_devuelta as number) > 0 && ` | Dev: ${si.cantidad_devuelta as number}`}
                            {(si.cantidad_no_devuelta as number) > 0 && <span className="text-destructive"> | Falta: {si.cantidad_no_devuelta as number}</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {!!(detalle.notas_solicitud) && <p className="text-sm text-muted-foreground">Notas: {detalle.notas_solicitud as string}</p>}
                  {!!(detalle.notas_miga) && <p className="text-sm text-muted-foreground">Notas Miga: {detalle.notas_miga as string}</p>}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  {estado === 'solicitada' && permisos.es_staff_utileria && (
                    <>
                      <Button onClick={() => handlePreparar(detalle)} disabled={actionLoading}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Marcar preparada
                      </Button>
                      <Button variant="outline" onClick={() => handleCancelar(detalle.id as string)}>Cancelar</Button>
                    </>
                  )}
                  {estado === 'preparada' && permisos.es_staff_utileria && (
                    <Button onClick={() => handleEntregar(detalle)} disabled={actionLoading}>
                      <Truck className="h-4 w-4 mr-1" /> Registrar entrega
                    </Button>
                  )}
                  {(estado === 'entregada' || estado === 'devolucion_parcial') && permisos.es_staff_utileria && (
                    <>
                      <Button onClick={() => handleDevolucion(detalle)} disabled={actionLoading}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Devolucion completa
                      </Button>
                      {estado === 'devolucion_parcial' && (
                        <Button variant="destructive" onClick={() => handleCerrarCargo(detalle.id as string)} disabled={actionLoading}>
                          <AlertTriangle className="h-4 w-4 mr-1" /> Cerrar con cargo
                        </Button>
                      )}
                    </>
                  )}
                  {estado === 'entregada' && permisos.es_staff_utileria && !!(detalle.fecha_devolucion_esperada) && new Date(detalle.fecha_devolucion_esperada as string) < new Date() && (
                    <Button variant="destructive" onClick={() => handleCerrarCargo(detalle.id as string)} disabled={actionLoading}>
                      <AlertTriangle className="h-4 w-4 mr-1" /> Cerrar con cargo (vencida)
                    </Button>
                  )}
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
