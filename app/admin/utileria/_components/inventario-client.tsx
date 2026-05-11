'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, Search, Package, Pencil, Trash2 } from 'lucide-react'
import type { PermisosUtileria } from '@/lib/permisos/utileria'
import { listarItems, crearItem, editarItem, darDeBajaItem, fetchEquiposUtileria } from '../_actions'
import { CATEGORIAS } from '../_constants'

interface Equipo { id: string; nombre: string }

const CATEGORIA_LABELS: Record<string, string> = {
  indumentaria_juego: 'Indumentaria juego',
  indumentaria_entrenamiento: 'Indumentaria entrenamiento',
  material_deportivo: 'Material deportivo',
  gym: 'Gym',
  medico: 'Médico',
  primeros_auxilios: 'Primeros auxilios',
  accesorios: 'Accesorios',
  consumible: 'Consumible',
  otro: 'Otro',
}

export function InventarioClient({ permisos }: { permisos: PermisosUtileria }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [equipoFiltro, setEquipoFiltro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nombre: '', categoria: 'material_deportivo', subcategoria: '', marca: '', modelo: '',
    color: '', talle: '', cantidad_total: 1, es_unico: false, numero_serie: '',
    costo_reposicion: 0, equipo_id: '', es_consumible: false, ubicacion_vestuario: '', notas: '',
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await listarItems({
      categoria: catFiltro || undefined,
      equipo_id: equipoFiltro || undefined,
      busqueda: busqueda || undefined,
    })
    if (res.ok) setItems(res.data as Record<string, unknown>[])
    else toast.error(res.message)
    setLoading(false)
  }, [busqueda, catFiltro, equipoFiltro])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { fetchEquiposUtileria().then(setEquipos) }, [])

  const resetForm = () => {
    setForm({
      nombre: '', categoria: 'material_deportivo', subcategoria: '', marca: '', modelo: '',
      color: '', talle: '', cantidad_total: 1, es_unico: false, numero_serie: '',
      costo_reposicion: 0, equipo_id: '', es_consumible: false, ubicacion_vestuario: '', notas: '',
    })
    setEditando(null)
  }

  const handleNuevo = () => { resetForm(); setModalOpen(true) }

  const handleEditar = (item: Record<string, unknown>) => {
    setEditando(item)
    setForm({
      nombre: item.nombre as string ?? '',
      categoria: item.categoria as string ?? 'material_deportivo',
      subcategoria: item.subcategoria as string ?? '',
      marca: item.marca as string ?? '',
      modelo: item.modelo as string ?? '',
      color: item.color as string ?? '',
      talle: item.talle as string ?? '',
      cantidad_total: item.cantidad_total as number ?? 1,
      es_unico: item.es_unico as boolean ?? false,
      numero_serie: item.numero_serie as string ?? '',
      costo_reposicion: item.costo_reposicion as number ?? 0,
      equipo_id: item.equipo_id as string ?? '',
      es_consumible: item.es_consumible as boolean ?? false,
      ubicacion_vestuario: item.ubicacion_vestuario as string ?? '',
      notas: item.notas as string ?? '',
    })
    setModalOpen(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return toast.error('Nombre obligatorio')
    setSaving(true)
    const input = {
      ...form,
      equipo_id: form.equipo_id || undefined,
      costo_reposicion: Number(form.costo_reposicion),
      cantidad_total: Number(form.cantidad_total),
    }

    const res = editando
      ? await editarItem(editando.id as string, input)
      : await crearItem(input as Parameters<typeof crearItem>[0])

    if (res.ok) {
      toast.success(res.message)
      setModalOpen(false)
      resetForm()
      cargar()
    } else {
      toast.error(res.message)
    }
    setSaving(false)
  }

  const handleBaja = async (id: string) => {
    if (!confirm('Dar de baja este item?')) return
    const res = await darDeBajaItem(id)
    if (res.ok) { toast.success(res.message); cargar() }
    else toast.error(res.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario de Utileria</h1>
        <Button onClick={handleNuevo}><Plus className="h-4 w-4 mr-1" /> Nuevo item</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-8" />
        </div>
        <Select value={catFiltro} onValueChange={v => setCatFiltro(v ?? '')}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay items en el inventario</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-2 font-medium">Nombre</th>
                <th className="py-2 px-2 font-medium">Categoria</th>
                <th className="py-2 px-2 font-medium">Marca</th>
                <th className="py-2 px-2 font-medium">Stock</th>
                <th className="py-2 px-2 font-medium">Costo rep.</th>
                <th className="py-2 px-2 font-medium">Estado</th>
                <th className="py-2 px-2 font-medium">Equipo</th>
                <th className="py-2 px-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const equipo = item.equipos as Record<string, unknown> | Record<string, unknown>[] | null
                const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
                return (
                  <tr key={item.id as string} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">
                      {item.nombre as string}
                      {item.es_unico as boolean && <Badge variant="outline" className="ml-1 text-[10px]">Unico</Badge>}
                    </td>
                    <td className="py-2 px-2">{CATEGORIA_LABELS[item.categoria as string] ?? item.categoria as string}</td>
                    <td className="py-2 px-2 text-muted-foreground">{item.marca as string ?? '-'}</td>
                    <td className="py-2 px-2">
                      <Badge variant={(item.cantidad_disponible as number) === 0 ? 'destructive' : 'secondary'}>
                        {item.cantidad_disponible as number}/{item.cantidad_total as number}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">${(item.costo_reposicion as number)?.toLocaleString('es-AR')}</td>
                    <td className="py-2 px-2">
                      <Badge variant={item.estado === 'disponible' ? 'default' : 'destructive'}>{item.estado as string}</Badge>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{equipoNombre as string ?? 'Institucional'}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditar(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleBaja(item.id as string)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar item' : 'Nuevo item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v ?? 'otro' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategoria</Label>
                <Input value={form.subcategoria} onChange={e => setForm(f => ({ ...f, subcategoria: e.target.value }))} placeholder="pelota, cono..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
              <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
              <div><Label>Color</Label><Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Talle</Label><Input value={form.talle} onChange={e => setForm(f => ({ ...f, talle: e.target.value }))} /></div>
              <div><Label>Cantidad</Label><Input type="number" min={1} value={form.cantidad_total} onChange={e => setForm(f => ({ ...f, cantidad_total: parseInt(e.target.value) || 1 }))} /></div>
              <div><Label>Costo reposicion</Label><Input type="number" min={0} value={form.costo_reposicion} onChange={e => setForm(f => ({ ...f, costo_reposicion: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div>
              <Label>Equipo (vacio = institucional)</Label>
              <Select value={form.equipo_id} onValueChange={v => setForm(f => ({ ...f, equipo_id: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Institucional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Institucional</SelectItem>
                  {equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ubicacion vestuario</Label><Input value={form.ubicacion_vestuario} onChange={e => setForm(f => ({ ...f, ubicacion_vestuario: e.target.value }))} placeholder="Estante A1..." /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.es_unico} onCheckedChange={(c: boolean) => setForm(f => ({ ...f, es_unico: c, cantidad_total: c ? 1 : f.cantidad_total }))} /> Item unico (serie)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.es_consumible} onCheckedChange={(c: boolean) => setForm(f => ({ ...f, es_consumible: c }))} /> Consumible
              </label>
            </div>
            {form.es_unico && (
              <div><Label>Numero de serie</Label><Input value={form.numero_serie} onChange={e => setForm(f => ({ ...f, numero_serie: e.target.value }))} /></div>
            )}
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardar} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editando ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
