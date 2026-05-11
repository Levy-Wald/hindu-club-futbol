'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, Package, ChevronRight } from 'lucide-react'
import type { PermisosUtileria } from '@/lib/permisos/utileria'
import { listarKitsPorEquipo, crearKit, agregarItemAKit, removerItemDeKit, listarItems, fetchEquiposUtileria } from '@/modules/utileria/lib/actions'

interface Equipo { id: string; nombre: string }

const TIPO_LABELS: Record<string, string> = {
  partido_local: 'Partido local',
  partido_visita: 'Partido visita',
  entrenamiento: 'Entrenamiento',
  amistoso: 'Amistoso',
  torneo: 'Torneo',
  custom: 'Custom',
}

export function KitsClient({ permisos }: { permisos: PermisosUtileria }) {
  const [kits, setKits] = useState<Record<string, unknown>[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [equipoFiltro, setEquipoFiltro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ equipo_id: '', nombre: '', tipo: 'entrenamiento', descripcion: '' })

  // Item add
  const [addItemKitId, setAddItemKitId] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<Record<string, unknown>[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedCantidad, setSelectedCantidad] = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await listarKitsPorEquipo(equipoFiltro || undefined)
    if (res.ok) setKits(res.data as Record<string, unknown>[])
    else toast.error(res.message)
    setLoading(false)
  }, [equipoFiltro])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { fetchEquiposUtileria().then(setEquipos) }, [])

  const handleCrearKit = async () => {
    if (!form.nombre.trim() || !form.equipo_id) return toast.error('Nombre y equipo obligatorios')
    setSaving(true)
    const res = await crearKit(form)
    if (res.ok) { toast.success(res.message); setModalOpen(false); cargar() }
    else toast.error(res.message)
    setSaving(false)
  }

  const handleOpenAddItem = async (kitId: string) => {
    setAddItemKitId(kitId)
    if (allItems.length === 0) {
      const res = await listarItems({ solo_disponibles: true })
      if (res.ok) setAllItems(res.data as Record<string, unknown>[])
    }
  }

  const handleAddItem = async () => {
    if (!addItemKitId || !selectedItemId) return
    const res = await agregarItemAKit(addItemKitId, selectedItemId, selectedCantidad)
    if (res.ok) { toast.success(res.message); setAddItemKitId(null); setSelectedItemId(''); setSelectedCantidad(1); cargar() }
    else toast.error(res.message)
  }

  const handleRemoveItem = async (kitId: string, itemId: string) => {
    const res = await removerItemDeKit(kitId, itemId)
    if (res.ok) { toast.success(res.message); cargar() }
    else toast.error(res.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kits de Utileria</h1>
        <Button onClick={() => { setForm({ equipo_id: '', nombre: '', tipo: 'entrenamiento', descripcion: '' }); setModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo kit
        </Button>
      </div>

      <Select value={equipoFiltro} onValueChange={v => setEquipoFiltro(v ?? '')}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por equipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : kits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay kits creados</div>
      ) : (
        <div className="grid gap-4">
          {kits.map(kit => {
            const equipo = kit.equipos as Record<string, unknown> | Record<string, unknown>[] | null
            const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
            const kitItems = (kit.utileria_kit_items ?? []) as Record<string, unknown>[]
            return (
              <Card key={kit.id as string}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{kit.nombre as string}</CardTitle>
                    <div className="flex gap-1">
                      <Badge variant="secondary">{TIPO_LABELS[kit.tipo as string] ?? kit.tipo as string}</Badge>
                      <Badge variant="outline">{equipoNombre as string}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {kitItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin items</p>
                  ) : (
                    <div className="space-y-1">
                      {kitItems.map((ki: Record<string, unknown>) => {
                        const itemData = ki.utileria_items as Record<string, unknown> | Record<string, unknown>[] | null
                        const itemNombre = Array.isArray(itemData) ? (itemData[0] as Record<string, unknown>)?.nombre : (itemData as Record<string, unknown>)?.nombre
                        return (
                          <div key={ki.id as string} className="flex items-center justify-between text-sm">
                            <span><Package className="h-3 w-3 inline mr-1" />{itemNombre as string} x{ki.cantidad as number}</span>
                            {permisos.es_staff_utileria && (
                              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleRemoveItem(kit.id as string, ki.item_id as string)}>Quitar</Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {permisos.es_staff_utileria && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => handleOpenAddItem(kit.id as string)}>
                      <Plus className="h-3 w-3 mr-1" /> Agregar item
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal crear kit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo kit</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
            <div><Label>Equipo *</Label>
              <Select value={form.equipo_id} onValueChange={v => setForm(f => ({ ...f, equipo_id: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>{equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v ?? 'custom' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descripcion</Label><Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrearKit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal agregar item a kit */}
      <Dialog open={!!addItemKitId} onOpenChange={() => setAddItemKitId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar item al kit</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Item</Label>
              <Select value={selectedItemId} onValueChange={v => setSelectedItemId(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar item" /></SelectTrigger>
                <SelectContent>{allItems.map(i => <SelectItem key={i.id as string} value={i.id as string}>{i.nombre as string}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cantidad</Label><Input type="number" min={1} value={selectedCantidad} onChange={e => setSelectedCantidad(parseInt(e.target.value) || 1)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemKitId(null)}>Cancelar</Button>
            <Button onClick={handleAddItem}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
